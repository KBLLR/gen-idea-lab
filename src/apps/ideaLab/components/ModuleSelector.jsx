import c from 'clsx';
import useStore from '@store';
import { selectModule } from '@shared/lib/actions/ideaLabActions.js';
import { personalities } from '@shared/lib/assistant/personalities.js';
import { modulesByDiscipline } from '@shared/lib/modules.js';

const ModuleSelector = () => {
  const activeModuleId = useStore.use.activeModuleId();

  return (
    <>
      {Object.entries(modulesByDiscipline).map(([discipline, modules]) => (
        <div className="semester-group" key={discipline}>
          <h2>{discipline}</h2>
          <div className="module-list">
            {modules.map(module => {
              const personality = personalities[module['Module Code']];
              return (
                <button
                  key={module['Module Code']}
                  onClick={() => selectModule(module['Module Code'])}
                  className={c({ active: module['Module Code'] === activeModuleId })}
                >
                  <div className="module-info">
                    <span className="icon">{personality?.icon || 'school'}</span>
                    <p>{personality?.name || module['Module Title']}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
};

export default ModuleSelector;
