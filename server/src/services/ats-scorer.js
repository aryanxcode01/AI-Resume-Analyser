import { scoringWeights } from '../config/scoring.js';

function check(id, label, passed, score, maxScore, message) {
  return { id, label, passed, score, maxScore, message };
}

function hasContact(profile) {
  return Boolean(profile.contact.email && profile.contact.phone);
}

export function scoreAtsReadiness({ text, sections, profile, clarityScore = 50 }) {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const bulletCount = (text.match(/^\s*(?:[-*•]|\d+[.)])\s+/gm) ?? []).length;
  const sectionCount = ['summary', 'skills', 'experience', 'education'].filter(
    (section) => sections[section].length > 0,
  ).length;
  const hasStandardHeadings = sectionCount >= 3;
  const looksColumnar =
    (text.match(/ {5,}/g) ?? []).length >= 3 || (text.match(/\|/g) ?? []).length >= 5;

  const breakdown = [
    check(
      'contact',
      'Contact details',
      hasContact(profile),
      hasContact(profile) ? scoringWeights.contact : 0,
      scoringWeights.contact,
      hasContact(profile)
        ? 'Email and phone number found.'
        : 'Add both an email address and phone number.',
    ),
    check(
      'sections',
      'Core sections',
      sectionCount >= 3,
      Math.round((sectionCount / 4) * scoringWeights.sections),
      scoringWeights.sections,
      `${sectionCount} of 4 core sections found.`,
    ),
    check(
      'headings',
      'Standard headings',
      hasStandardHeadings,
      hasStandardHeadings ? scoringWeights.headings : 0,
      scoringWeights.headings,
      hasStandardHeadings
        ? 'Standard headings are easy for an ATS to recognize.'
        : 'Use standard, explicit section headings.',
    ),
    check(
      'length',
      'Resume length',
      wordCount >= 300 && wordCount <= 1200,
      wordCount >= 300 && wordCount <= 1200
        ? scoringWeights.length
        : Math.round(scoringWeights.length / 3),
      scoringWeights.length,
      `${wordCount} words detected; aim for roughly 300–1,200 words.`,
    ),
    check(
      'bullets',
      'Readable bullet points',
      bulletCount >= 4,
      bulletCount >= 4 ? scoringWeights.bullets : 0,
      scoringWeights.bullets,
      bulletCount >= 4
        ? `${bulletCount} bullet points detected.`
        : 'Use bullet points to make achievements easier to scan.',
    ),
    check(
      'layout',
      'Simple layout',
      !looksColumnar,
      !looksColumnar ? scoringWeights.layout : 0,
      scoringWeights.layout,
      !looksColumnar
        ? 'No strong table or multi-column signal was found.'
        : 'Possible table or multi-column formatting detected.',
    ),
    check(
      'clarity',
      'Writing clarity',
      clarityScore >= 70,
      Math.round((clarityScore / 100) * scoringWeights.clarity),
      scoringWeights.clarity,
      `Estimated writing clarity: ${clarityScore}/100.`,
    ),
  ];

  const atsScore = breakdown.reduce((total, item) => total + item.score, 0);
  return { atsScore, breakdown, metrics: { wordCount, bulletCount, sectionCount } };
}
