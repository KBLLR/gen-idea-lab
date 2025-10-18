/**
 * Module Knowledge System Initialization Script
 *
 * Creates database collections for CODE University's module-first architecture:
 * - 1 modules collection (metadata for all 40 modules)
 * - 40 × 3 = 120 per-module collections (knowledge, conversations, progress)
 *
 * Total: 121 collections
 *
 * Usage: node server/scripts/initializeModules.js
 */

import { MongoClient } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'genbooth-modules';

// Vector embedding dimensions (Gemini text-embedding-004)
const EMBEDDING_DIMENSIONS = 768;

/**
 * Load and parse the official CODE University modules data
 */
async function loadModulesData() {
  const modulesPath = path.resolve(__dirname, '../../src/apps/ideaLab/data/modules-code-university.json');
  const data = await fs.readFile(modulesPath, 'utf-8');
  const modules = JSON.parse(data);

  // Filter out BM_ modules (as per modules.js)
  const activeModules = modules.filter(module => !module['Module Code'].startsWith('BM_'));

  console.log(`📚 Loaded ${activeModules.length} active modules (${modules.length - activeModules.length} BM modules filtered out)`);

  return activeModules;
}

/**
 * Create module document with assistant configuration
 */
function createModuleDocument(rawModule) {
  const moduleCode = rawModule['Module Code'];
  const discipline = moduleCode.startsWith('DS_') ? 'Design' :
                    moduleCode.startsWith('SE_') ? 'Software Engineering' :
                    moduleCode.startsWith('STS_') ? 'Science & Society' :
                    moduleCode.startsWith('BA_') ? 'Synthesis' :
                    'Orientation';

  // Extract key topics for assistant context
  const keyTopics = rawModule['Key Contents/Topics'] || '';
  const objectives = rawModule['Qualification Objectives'] || '';

  // Generate assistant persona based on module type
  const assistantPersona = generateAssistantPersona(moduleCode, rawModule['Module Title']);

  return {
    moduleCode,
    moduleTitle: rawModule['Module Title'],
    moduleCoordinator: rawModule['Module Coordinator'],
    discipline,
    semester: rawModule['Semester'],
    ects: rawModule['ECTS'],

    // Academic content
    qualificationObjectives: objectives,
    keyTopics,
    targetGroup: rawModule['Target Group'],

    // Assistant configuration
    assistant: {
      name: assistantPersona.name,
      persona: assistantPersona.persona,
      systemPrompt: generateSystemPrompt(moduleCode, rawModule['Module Title'], objectives, keyTopics),
      tools: [
        'query_knowledge_base',
        'add_to_knowledge_base',
        'generate_exercise',
        'assess_understanding',
        'suggest_resources',
        'connect_to_other_modules'
      ]
    },

    // RAG configuration
    rag: {
      knowledgeCollection: `module_${moduleCode}_knowledge`,
      conversationsCollection: `module_${moduleCode}_conversations`,
      progressCollection: `module_${moduleCode}_progress`,
      embeddingModel: 'text-embedding-004',
      embeddingDimensions: EMBEDDING_DIMENSIONS
    },

    // Metadata
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };
}

/**
 * Generate assistant persona based on module characteristics
 */
function generateAssistantPersona(moduleCode, moduleTitle) {
  // Orientation modules - welcoming, foundational
  if (moduleCode.startsWith('OS_')) {
    return {
      name: 'Dr. CodeMentor',
      persona: 'Patient, encouraging teacher who breaks down complex software concepts into digestible pieces. Uses real-world examples and Socratic questioning.'
    };
  }

  // Design modules - creative, human-centered
  if (moduleCode.startsWith('DS_')) {
    return {
      name: 'Design Sage',
      persona: 'Creative facilitator who connects design thinking with technical implementation. Encourages iteration and user-centered approaches.'
    };
  }

  // Software Engineering - precise, practical
  if (moduleCode.startsWith('SE_')) {
    return {
      name: 'Arch Engineer',
      persona: 'Pragmatic software architect who emphasizes clean code, testing, and scalable design. Balances theory with hands-on practice.'
    };
  }

  // Science, Technology & Society - critical, interdisciplinary
  if (moduleCode.startsWith('STS_')) {
    return {
      name: 'Tech Philosopher',
      persona: 'Critical thinker who explores the societal implications of technology. Encourages ethical reflection and interdisciplinary thinking.'
    };
  }

  // Synthesis modules - integrative, project-based
  if (moduleCode.startsWith('BA_')) {
    return {
      name: 'Project Catalyst',
      persona: 'Integrative guide who helps connect learnings across disciplines. Focuses on synthesis and real-world application.'
    };
  }

  return {
    name: 'Module Guide',
    persona: 'Knowledgeable assistant for ' + moduleTitle
  };
}

/**
 * Generate system prompt for module assistant
 */
function generateSystemPrompt(moduleCode, moduleTitle, objectives, keyTopics) {
  return `You are the AI assistant for ${moduleCode}: ${moduleTitle} at CODE University of Applied Sciences.

**Your Role:**
- Guide students through learning objectives and key concepts
- Facilitate understanding through Socratic dialogue
- Generate exercises aligned with qualification objectives
- Track student progress and adapt difficulty
- Connect this module to related courses

**Module Objectives:**
${objectives}

**Key Topics:**
${keyTopics}

**Available Tools:**
- query_knowledge_base: Search student's personal knowledge base for this module
- add_to_knowledge_base: Save important learnings to knowledge base
- generate_exercise: Create practice problems aligned with objectives
- assess_understanding: Evaluate student's grasp of concepts
- suggest_resources: Recommend learning materials
- connect_to_other_modules: Show interdisciplinary connections

**Approach:**
1. Start by understanding what the student already knows
2. Build on their existing knowledge progressively
3. Use real-world examples from software engineering
4. Encourage hands-on practice and experimentation
5. Celebrate progress and provide constructive feedback

**Tone:** Patient, encouraging, technically precise, and Socratic.`;
}

/**
 * Create database collections with proper indexes
 */
async function createCollections(db, modules) {
  console.log('\n📦 Creating database collections...\n');

  // 1. Create main modules collection
  console.log('Creating modules collection...');
  const modulesCollection = db.collection('modules');

  // Create unique index on moduleCode
  await modulesCollection.createIndex({ moduleCode: 1 }, { unique: true });
  await modulesCollection.createIndex({ discipline: 1 });
  await modulesCollection.createIndex({ isActive: 1 });

  // Insert all module documents
  const moduleDocuments = modules.map(createModuleDocument);
  await modulesCollection.deleteMany({}); // Clear existing
  const result = await modulesCollection.insertMany(moduleDocuments);

  console.log(`✅ Inserted ${result.insertedCount} modules\n`);

  // 2. Create per-module collections (3 per module × 40 modules = 120 collections)
  let collectionsCreated = 0;

  for (const module of moduleDocuments) {
    const { moduleCode } = module;
    console.log(`Creating collections for ${moduleCode}...`);

    // Knowledge collection (RAG vectors)
    const knowledgeCollection = db.collection(`module_${moduleCode}_knowledge`);
    await knowledgeCollection.createIndex({ userId: 1, moduleCode: 1 });
    await knowledgeCollection.createIndex({ type: 1 });
    await knowledgeCollection.createIndex({ timestamp: -1 });
    await knowledgeCollection.createIndex({ 'metadata.topic': 1 });

    // Vector search index (requires Atlas - will log warning if not available)
    try {
      await knowledgeCollection.createIndex(
        { embedding: '2dsphere' },
        {
          name: 'vector_index',
          '2dsphereIndexVersion': 3
        }
      );
    } catch (error) {
      console.log(`  ⚠️  Vector index for ${moduleCode} requires MongoDB Atlas (skipping)`);
    }

    // Conversations collection
    const conversationsCollection = db.collection(`module_${moduleCode}_conversations`);
    await conversationsCollection.createIndex({ userId: 1, moduleCode: 1 });
    await conversationsCollection.createIndex({ conversationId: 1 }, { unique: true });
    await conversationsCollection.createIndex({ startedAt: -1 });

    // Progress collection
    const progressCollection = db.collection(`module_${moduleCode}_progress`);
    await progressCollection.createIndex({ userId: 1, moduleCode: 1 }, { unique: true });
    await progressCollection.createIndex({ lastUpdated: -1 });

    collectionsCreated += 3;
    console.log(`  ✅ Created 3 collections for ${moduleCode} (${collectionsCreated}/120)`);
  }

  console.log(`\n🎉 Successfully created ${collectionsCreated} per-module collections`);
  console.log(`📊 Total: 1 modules collection + ${collectionsCreated} module collections = ${collectionsCreated + 1} collections`);

  return { modulesCollection, collectionsCreated };
}

/**
 * Verify collection creation
 */
async function verifyCollections(db, expectedModules) {
  console.log('\n🔍 Verifying collections...\n');

  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);

  // Check modules collection
  const hasModules = collectionNames.includes('modules');
  console.log(`  ${hasModules ? '✅' : '❌'} modules collection`);

  // Check per-module collections
  let knowledgeCount = 0;
  let conversationsCount = 0;
  let progressCount = 0;

  for (const name of collectionNames) {
    if (name.endsWith('_knowledge')) knowledgeCount++;
    if (name.endsWith('_conversations')) conversationsCount++;
    if (name.endsWith('_progress')) progressCount++;
  }

  console.log(`  ${knowledgeCount === expectedModules ? '✅' : '❌'} ${knowledgeCount} knowledge collections (expected ${expectedModules})`);
  console.log(`  ${conversationsCount === expectedModules ? '✅' : '❌'} ${conversationsCount} conversation collections (expected ${expectedModules})`);
  console.log(`  ${progressCount === expectedModules ? '✅' : '❌'} ${progressCount} progress collections (expected ${expectedModules})`);

  const totalExpected = 1 + (expectedModules * 3);
  const totalActual = collectionNames.filter(n =>
    n === 'modules' ||
    n.includes('module_') && (n.endsWith('_knowledge') || n.endsWith('_conversations') || n.endsWith('_progress'))
  ).length;

  console.log(`\n📈 Total collections: ${totalActual} (expected ${totalExpected})`);

  return totalActual === totalExpected;
}

/**
 * Display module breakdown by discipline
 */
async function displayModuleSummary(modulesCollection) {
  console.log('\n📚 Module Summary by Discipline:\n');

  const pipeline = [
    { $group: { _id: '$discipline', count: { $sum: 1 }, modules: { $push: '$moduleCode' } } },
    { $sort: { count: -1 } }
  ];

  const summary = await modulesCollection.aggregate(pipeline).toArray();

  for (const { _id, count, modules } of summary) {
    console.log(`  ${_id}: ${count} modules`);
    console.log(`    ${modules.join(', ')}`);
  }

  const total = summary.reduce((sum, { count }) => sum + count, 0);
  console.log(`\n  Total: ${total} active modules`);
}

/**
 * Main initialization function
 */
async function main() {
  console.log('🚀 Initializing CODE University Module Knowledge System\n');
  console.log(`📍 Database: ${DB_NAME}`);
  console.log(`🔗 URI: ${MONGODB_URI}\n`);

  let client;

  try {
    // Load modules data
    const modules = await loadModulesData();

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected\n');

    const db = client.db(DB_NAME);

    // Create collections
    const { modulesCollection, collectionsCreated } = await createCollections(db, modules);

    // Verify
    const verified = await verifyCollections(db, modules.length);

    if (verified) {
      console.log('\n✅ Verification passed!');
    } else {
      console.log('\n⚠️  Verification found inconsistencies');
    }

    // Display summary
    await displayModuleSummary(modulesCollection);

    console.log('\n🎓 Module knowledge system initialized successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Implement EmbeddingService for vector embeddings');
    console.log('  2. Create module assistant tools');
    console.log('  3. Test with OS_01 module');
    console.log('  4. Integrate with Idea Lab UI\n');

  } catch (error) {
    console.error('\n❌ Initialization failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { loadModulesData, createModuleDocument, generateSystemPrompt };
