import { useMemo, useState } from 'react';

import Styles from './Experiences.module.css';

import experiences from '../../data/experiences.json';

const DotWithTooltip = ({
  text,
  position,
}: {
  text: string | number;
  position: string;
}) => {
  return (
    <div className={Styles.dot + ' tooltip show'}>
      <div
        className={'tooltip-text'}
        style={{
          transform: `translate(-${position === 'left' ? 80 : 20}%, -50%)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Experience = () => {
  const presentExperience = experiences.find(
    (e) => e.layer === 0 && e.to === 'Present',
  ) as (typeof experiences)[0];
  const { start = 0, proportion = 0 } = presentExperience;
  const branchLength = start + proportion;

  const { mainBranchExperiences, sideBranchExperiences } = useMemo(() => {
    const mainBranchExperiences: typeof experiences = [];
    const sideBranchExperiences: typeof experiences = [];
    experiences
      .sort((a, b) => a.year - b.year)
      .forEach((experience) => {
        const { layer = 0 } = experience;
        if (layer === 0) {
          mainBranchExperiences.push(experience);
        } else {
          sideBranchExperiences.push(experience);
        }
      });

    return { mainBranchExperiences, sideBranchExperiences };
  }, []);

  const [activeExp, setActiveExp] = useState<
    typeof presentExperience | undefined
  >(presentExperience);

  const renderExpCommit = (
    { start, year, proportion = 1, layer = 0, to }: typeof presentExperience,
    index: number,
  ) => {
    const experiences =
      layer === 0 ? mainBranchExperiences : sideBranchExperiences;
    const experience = experiences.find(({ year: eYear }) => year === eYear);
    const isActive =
      experience?.layer === activeExp?.layer &&
      experience?.year === activeExp?.year;
    const isLast = index === experiences.length - 1;
    const width = `
      calc((100% - 8px) * ${proportion / branchLength}
      + ${isLast ? '8px' : '0px'})
    `;

    // For layer 1 (side project)
    const marginLeft = `calc(100dvw * ${start / (start + proportion + branchLength)}`;

    if (layer === 1) {
      console.log({ start, proportion, branchLength });
    }

    return (
      <div
        key={index}
        className={
          Styles.experience + ' ' + (isActive ? Styles.active : '') + ' tooltip'
        }
        style={{ width, marginLeft: layer === 1 ? marginLeft : '' }}
        onMouseEnter={() => setActiveExp(experience)}
      >
        {layer === 0 && index === 0 ? (
          <DotWithTooltip text={year} position={'right'} />
        ) : (
          <div className={Styles.dot} />
        )}
        {layer === 0 ? (
          !isLast ? (
            <div className={Styles.stroke} />
          ) : (
            <>
              <div
                className={Styles.stroke}
                style={{ width: 'calc(100% - 8px - 8px)' }}
              />
              <DotWithTooltip text={to} position={'left'} />
            </>
          )
        ) : !isLast ? (
          <div className={Styles.stroke} />
        ) : (
          <>
            <div
              className={Styles.stroke}
              style={{ width: 'calc(100% - 8px - 45px)' }}
            />
            <div
              className={Styles.stroke}
              style={{
                width: '45px',
                transform:
                  'rotate(132deg) translate(-14px, 16.5px) scaleX(1.33)',
                borderRadius: '2px',
              }}
            />
          </>
        )}

        <div className={Styles.preview + ' tooltip-text'}>
          <div>
            {experience?.role}
            {experience?.company === 'n/a' ? '' : ` @ ${experience?.company}`}
          </div>
          <div className={Styles.date}>
            {experience?.from} - {experience?.to}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <h3 className="tagline">
        {Math.floor(new Date().getFullYear() - 2016)} years of building web
        products and platforms, for a living and for fun
      </h3>
      <div className={Styles.experiences} style={{ zIndex: 100 }}>
        {mainBranchExperiences.map(renderExpCommit)}
      </div>
      {/* <div
        className={Styles.experiences}
        style={{ zIndex: 50, textAlign: 'left' }}
      >
        {sideBranchExperiences.map(renderExpCommit)}
      </div> */}

      {activeExp && (
        <div className={Styles.content}>
          {activeExp.company !== 'n/a' && (
            <div
              style={{
                maxWidth: '170px',
                height: '60px',
                paddingBottom: '4px',
              }}
            >
              <img
                src={activeExp.imageUrl}
                alt={activeExp.company}
                style={{ height: '100%' }}
              />
            </div>
          )}
          <h3>
            {activeExp.role}
            {activeExp.company === 'n/a' ? (
              ''
            ) : (
              <>
                {' '}
                @{' '}
                <a href={activeExp.url} target="_blank" rel="noreferrer">
                  {activeExp.company}
                </a>
              </>
            )}
          </h3>
          <div>
            {activeExp.from} - {activeExp.to}
          </div>
          <hr />
          <div>
            {/* •· */}
            {activeExp.description.map((desc) => {
              return (
                <div key={desc} className={Styles.item}>
                  • {desc}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default Experience;
