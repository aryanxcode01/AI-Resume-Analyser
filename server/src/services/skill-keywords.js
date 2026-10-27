const skillVocabulary = [
  'accessibility',
  'agile',
  'angular',
  'aws',
  'azure',
  'c#',
  'c++',
  'ci/cd',
  'css',
  'data analysis',
  'docker',
  'figma',
  'git',
  'github actions',
  'graphql',
  'html',
  'java',
  'javascript',
  'jest',
  'kubernetes',
  'machine learning',
  'mongodb',
  'mysql',
  'next.js',
  'node.js',
  'openai',
  'postgresql',
  'python',
  'react',
  'redux',
  'rest api',
  'salesforce',
  'sql',
  'tableau',
  'tailwind',
  'tensorflow',
  'typescript',
  'ux research',
];

const ignoredWords = new Set([
  'about',
  'and',
  'application',
  'candidate',
  'collaborate',
  'company',
  'degree',
  'development',
  'engineer',
  'experience',
  'including',
  'knowledge',
  'looking',
  'position',
  'required',
  'responsibilities',
  'skills',
  'strong',
  'team',
  'technical',
  'work',
  'working',
  'years',
  'with',
  'will',
  'your',
]);

function normalize(value) {
  return value.toLowerCase().replace(/[.]/g, '').replace(/\s+/g, ' ').trim();
}

function containsTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(^|[^a-z0-9+#])${escaped}(?=$|[^a-z0-9+#])`, 'i').test(text);
}

export function extractJobKeywords(text) {
  const vocabularyMatches = skillVocabulary.filter((skill) => containsTerm(text, skill));
  const words = text.toLowerCase().match(/[a-z][a-z+#.]{3,}/g) ?? [];
  const counts = new Map();
  for (const word of words) {
    const normalized = normalize(word);
    if (!ignoredWords.has(normalized)) counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }
  const repeatedWords = [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 12)
    .map(([word]) => word);
  return [...new Set([...vocabularyMatches, ...repeatedWords])];
}

export function getSkillOverlap(resumeText, jobDescription) {
  const jobKeywords = extractJobKeywords(jobDescription);
  const matchedSkills = jobKeywords.filter((skill) => containsTerm(resumeText, skill));
  const missingSkills = jobKeywords.filter((skill) => !containsTerm(resumeText, skill));
  const keywordScore =
    jobKeywords.length === 0 ? 0 : Math.round((matchedSkills.length / jobKeywords.length) * 100);
  return { keywordScore, jobKeywords, matchedSkills, missingSkills };
}
