/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import goals from '../../docs/goals/goals.json';

export const buildGoalsSummary = (g) => {
  if (!g || !g.program) return 'Please remind me of my academic goals and requirements.';
  const p = g.program;
  const s = p.structure || {};
  const orient = s.orientation_semester;
  const core = s.core_semesters;
  const synth = s.synthesis_semester;

  const lines = [];
  lines.push('Academic Goals Reminder');
  lines.push('');
  lines.push(`Program: ${p.name} — ${p.degree_awarded}`);
  if (p.standard_semesters && p.ects_per_semester && p.total_ects_required) {
    lines.push(`Structure: ${p.standard_semesters} semesters, ${p.ects_per_semester} ECTS/semester, total ${p.total_ects_required} ECTS`);
  }
  if (orient) {
    const modCount = Array.isArray(orient.modules_mandatory) ? orient.modules_mandatory.length : 0;
    const ectsSum = (orient.modules_mandatory || []).reduce((sum, m) => sum + (m.ects || 0), 0);
    lines.push(`Orientation (Sem ${orient.semester_index}): ${modCount} mandatory modules, ~${ectsSum} ECTS`);
  }
  if (core) {
    const range = Array.isArray(core.range) ? `${core.range[0]}–${core.range[1]}` : '2–5';
    const ectsSum = (core.modules_mandatory || []).reduce((sum, m) => sum + (m.ects || 0), 0);
    lines.push(`Core (Sem ${range}): mandatory modules total ~${ectsSum} ECTS; electives chosen per rules`);
  }
  if (synth) {
    const ectsSum = (synth.modules_mandatory || []).reduce((sum, m) => sum + (m.ects || 0), 0);
    lines.push(`Synthesis (Sem ${synth.semester_index}): Capstone + Thesis (~${ectsSum} ECTS)`);
  }

  const cr = g.credit_requirements || {};
  if (cr) {
    lines.push('');
    lines.push('Credit requirements:');
    if (cr.mandatory_modules_ects) lines.push(`- Mandatory: ${cr.mandatory_modules_ects}`);
    if (cr.elective_mandatory_ects_min != null) lines.push(`- Elective-mandatory: ≥ ${cr.elective_mandatory_ects_min} ECTS`);
    if (cr.elective_ects_min != null) lines.push(`- Electives: ≥ ${cr.elective_ects_min} ECTS`);
    if (cr.elective_coherence_rule) lines.push(`- Coherence: ${cr.elective_coherence_rule}`);
  }

  const pr = g.progression_rules || {};
  if (pr) {
    lines.push('');
    lines.push('Progression:');
    if (pr.core_order_flexibility) lines.push(`- ${pr.core_order_flexibility}`);
    if (pr.specialization) {
      const sp = pr.specialization;
      const opt = sp.is_optional ? 'optional' : 'required';
      lines.push(`- Specialization is ${opt}; decide by: ${sp.must_decide_by}`);
    }
  }

  const gr = g.grading || {};
  if (gr.program_grade_computation) {
    lines.push('');
    lines.push('Grading:');
    if (gr.program_grade_computation.rule) lines.push(`- ${gr.program_grade_computation.rule}`);
    if (gr.program_grade_computation.capstone_and_thesis_weighting) lines.push(`- ${gr.program_grade_computation.capstone_and_thesis_weighting}`);
    if (gr.bachelor_thesis_breakdown) {
      const bt = gr.bachelor_thesis_breakdown;
      lines.push(`- Thesis breakdown: written ${Math.round((bt.written_component_weight || 0)*100)}%, colloquium ${Math.round((bt.colloquium_weight || 0)*100)}%`);
    }
  }

  const val = g.validation || {};
  if (Array.isArray(val.must_satisfy_all) && val.must_satisfy_all.length) {
    lines.push('');
    lines.push('Validation Checklist (must satisfy all):');
    for (const item of val.must_satisfy_all) lines.push(`- ${item}`);
  }

  lines.push('');
  lines.push('Given these requirements, please:');
  lines.push('- Summarize my current obligations and near-term milestones.');
  lines.push('- Suggest a short checklist for this week (ECTS tracking, elective planning, specialization decision timeline, capstone/thesis prep).');
  lines.push('- Flag any high-impact deadlines I should schedule now.');

  return lines.join('\n');
};

export const getGoalsSummary = () => buildGoalsSummary(goals);
