/**
 * 应用常量文本
 */

import { getLanguage } from '../utils/i18n';
import { WELCOME_MARKDOWN_ZH_CN } from './welcome_zh_CN';
import { WELCOME_MARKDOWN_EN } from './welcome_en';
import { WELCOME_MARKDOWN_ZH_TW } from './welcome_zh_TW';
import { WELCOME_MARKDOWN_JA } from './welcome_ja';
import { WELCOME_MARKDOWN_KO } from './welcome_ko';
import { WELCOME_MARKDOWN_FR } from './welcome_fr';
import { WELCOME_MARKDOWN_DE } from './welcome_de';
import { WELCOME_MARKDOWN_ES } from './welcome_es';
import { WELCOME_MARKDOWN_PT } from './welcome_pt';

const WELCOME_MAP: Record<string, string> = {
    'zh-CN': WELCOME_MARKDOWN_ZH_CN,
    'zh-TW': WELCOME_MARKDOWN_ZH_TW,
    'en': WELCOME_MARKDOWN_EN,
    'ja': WELCOME_MARKDOWN_JA,
    'ko': WELCOME_MARKDOWN_KO,
    'fr': WELCOME_MARKDOWN_FR,
    'de': WELCOME_MARKDOWN_DE,
    'es': WELCOME_MARKDOWN_ES,
    'pt': WELCOME_MARKDOWN_PT,
};

export function getWelcomeMarkdown(): string {
    return WELCOME_MAP[getLanguage()] ?? WELCOME_MARKDOWN_EN;
}
