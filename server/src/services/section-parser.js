const sectionDefinitions = [
  { name: 'summary', aliases: ['summary', 'professional summary', 'profile', 'objective'] },
  { name: 'skills', aliases: ['skills', 'technical skills', 'core competencies', 'competencies'] },
  {
    name: 'experience',
    aliases: ['experience', 'work experience', 'professional experience', 'employment history'],
  },
  { name: 'projects', aliases: ['projects', 'personal projects', 'selected projects'] },
  { name: 'education', aliases: ['education', 'academic background'] },
];

function normalizedHeading(line) {
  return line
    .trim()
    .toLowerCase()
    .replace(/[:\-–—]+$/, '')
    .replace(/\s+/g, ' ');
}

export function parseSections(text) {
  const sections = Object.fromEntries(sectionDefinitions.map(({ name }) => [name, '']));
  let currentSection = null;

  for (const line of text.split('\n')) {
    const heading = normalizedHeading(line);
    const definition = sectionDefinitions.find(({ aliases }) => aliases.includes(heading));
    if (definition) {
      currentSection = definition.name;
      continue;
    }
    if (currentSection) sections[currentSection] += `${line}\n`;
  }

  return Object.fromEntries(
    Object.entries(sections).map(([name, content]) => [name, content.trim()]),
  );
}

export function detectContacts(text) {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() ?? null;
  const links = [...text.matchAll(/(?:https?:\/\/|www\.)[^\s)]+/gi)].map(([link]) => link);
  return { email, phone, links };
}

export function extractListedSkills(skillsSection) {
  if (!skillsSection) return [];
  return [
    ...new Set(
      skillsSection
        .split(/[\n,;|•·]+/)
        .map((skill) => skill.trim().replace(/^[-–—]\s*/, ''))
        .filter((skill) => skill.length >= 2 && skill.length <= 60),
    ),
  ].slice(0, 50);
}
