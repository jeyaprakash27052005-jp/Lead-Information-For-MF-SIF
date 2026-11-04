import { AwarenessProgram, AwarenessSection } from '../types';

/** The pages every event has in its left menu (like the NISM conference page); the admin team writes their content */
export const STANDARD_PAGES = ['Speakers', 'Download Brochure', 'Program Schedule', 'Call for Papers', 'Themes', 'Conference Enquiry', 'FAQ'];

export const standardSections = (): AwarenessSection[] => STANDARD_PAGES.map((title, i) => ({ id: `std_${i}`, title }));

/** An event the admin never gave pages to shows the standard pages (each says "Will be updated soon") */
export const sectionsOf = (p: AwarenessProgram): AwarenessSection[] => (p.sections === undefined ? standardSections() : p.sections);
