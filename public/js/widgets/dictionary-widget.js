import { createWidgetShell, escapeHtml } from './widget-utils.js';

export function renderDictionaryWidget(data) {
    if (data.error) return `<div class="atlas-widget error">${escapeHtml(data.error)}</div>`;

    const entry = data.entry;
    const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';
    
    let meaningsHtml = '';
    for (const meaning of entry.meanings.slice(0, 2)) {
        meaningsHtml += `
            <div class="atlas-dict-meaning">
                <div class="atlas-dict-pos">${escapeHtml(meaning.partOfSpeech)}</div>
                <ul>
                    ${meaning.definitions.slice(0, 2).map(d => `<li>${escapeHtml(d.definition)}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    const content = `
        <div class="atlas-dict-word">${escapeHtml(entry.word)}</div>
        ${phonetic ? `<div class="atlas-dict-phonetic">${escapeHtml(phonetic)}</div>` : ''}
        ${meaningsHtml}
    `;

    return createWidgetShell('dictionary', '<i class="fa-solid fa-spell-check"></i>', 'Dictionary', content);
}
