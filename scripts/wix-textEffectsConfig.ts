/* oxlint-disable max-lines -- TODO: decompose this file and enable "max-lines" rule */
import type { InterchangeComponentOption } from '../../interchangeableComponentsUtils';
import type { BuilderStyle } from '@wix/document-services-types';

declare const window: Window & {
  serviceTopology?: { scriptsDomainUrl?: string };
};

const getTextEffectAssetUrl = (fileName: string): string => {
  const baseUrl = window.serviceTopology?.scriptsDomainUrl ?? '';
  return `${baseUrl}/services/santa-resources/dist/editor/interchangePanel/textEffect/v2/${fileName}`;
};

export type TextEffectsThumbnail = {
  asset: string;
};

export type TextEffectsComponentOption = InterchangeComponentOption & {
  thumbnail: TextEffectsThumbnail;
};

export type TextEffectPreset = {
  componentType: string;
  friendlyName: string;
  thumbnail: TextEffectsThumbnail;
  styles: BuilderStyle;
};

export const TEXT_EFFECTS_PRESETS: Record<string, TextEffectPreset> = {
  'outline-out-galaxy': {
    componentType: 'wixEditorElements.TextEffectsOutlineOut',
    friendlyName: 'Galaxy',
    thumbnail: {
      asset: getTextEffectAssetUrl('outline-out-galaxy.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsOutlineOut.Style',
      cssCustomProperties: {
        'bevel-angle': 'url(#outline-out-lightA3_azimuth:135)',
        'layer-blend-mode': 'url(#outline-out-dark-glass_blend-mode:multiply)',
        'text-effects-color-1': '#5A686D',
        'text-effects-color-2': '#5A686D',
      },
      cssProperties: {
        textTransform: 'none',
        fontStyle: 'italic',
        fontFamily: 'marzo-w00-regular',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'neon-sign-remix': {
    componentType: 'wixEditorElements.TextEffectsNeonSign',
    friendlyName: 'Remix',
    thumbnail: {
      asset: getTextEffectAssetUrl('neon-sign-remix.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsNeonSign.Style',
      cssCustomProperties: {
        'shadow-opacity': '0.5',
        'disable-inner-animation': 'initial',
        'text-color': '#fdfdfd',
        'inner-animation-speed': '4',
        'shadow-blur': '0.5',
        'shadow-color': '#4900FF',
      },
      cssProperties: {
        fontFamily: 'orbitron',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'outline-out-signal': {
    componentType: 'wixEditorElements.TextEffectsOutlineOut',
    friendlyName: 'Signal',
    thumbnail: {
      asset: getTextEffectAssetUrl('outline-out-signal.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsOutlineOut.Style',
      cssCustomProperties: {
        'bevel-angle': 'url(#outline-out-lightA3_azimuth:90)',
        'layer-blend-mode': 'url(#outline-out-dark-glass_blend-mode:normal)',
        'text-effects-color-1': '#00601A',
        'text-effects-color-2': '#00601A',
      },
      cssProperties: {
        textTransform: 'capitalize',
        fontStyle: 'italic',
        textAlign: 'center',
        fontFamily: 'brandon-grot-w01-light',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'glass-astro': {
    componentType: 'wixEditorElements.TextEffectsGlass',
    friendlyName: 'Astro',
    thumbnail: {
      asset: getTextEffectAssetUrl('glass-astro.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsGlass.Style',
      cssCustomProperties: {
        stroke: '#F3F3F3',
        'text-color': '#2E2A2A',
        'shadow-blur': 'url(#glass-shadow_blur:2)',
        'shadow-color': '#35383B',
        'stroke-width': '2px',
      },
      cssProperties: {
        fontStyle: 'italic',
        fontFamily: 'climate-crisis',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'sticker-apex': {
    componentType: 'wixEditorElements.TextEffectsSticker',
    friendlyName: 'Apex',
    thumbnail: {
      asset: getTextEffectAssetUrl('sticker-apex.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsSticker.Style',
      cssCustomProperties: {
        'fill-opacity': '1',
        'outer-stroke-angle': '0deg',
        'shadow-opacity': '1',
        'shadow-distance': '22',
        stroke: '#83A9FF',
        'outer-stroke-distance': '17',
        'shadow-blur': '4',
        fill: '#FFFFFF',
        'shadow-color': '#FFC4C4',
        'shadow-angle': '188deg',
        'stroke-width': '2px',
      },
      cssProperties: {
        textTransform: 'capitalize',
        textAlign: 'center',
        fontFamily: 'feonie',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'sticker-space': {
    componentType: 'wixEditorElements.TextEffectsSticker',
    friendlyName: 'Space',
    thumbnail: {
      asset: getTextEffectAssetUrl('sticker-space.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsSticker.Style',
      cssCustomProperties: {
        'fill-opacity': '1',
        'outer-stroke-angle': '167deg',
        'shadow-opacity': '1',
        'shadow-distance': '10',
        stroke: '#FF4CF7',
        'outer-stroke-distance': '17',
        'shadow-blur': '4',
        fill: '#FFFFFF',
        'shadow-color': '#EA00FF',
        'shadow-angle': '148deg',
        'stroke-width': '3px',
      },
      cssProperties: {
        textTransform: 'capitalize',
        fontFamily: 'enfonix',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'outline-out-jolt': {
    componentType: 'wixEditorElements.TextEffectsOutlineOut',
    friendlyName: 'Jolt',
    thumbnail: {
      asset: getTextEffectAssetUrl('outline-out-jolt.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsOutlineOut.Style',
      cssCustomProperties: {
        'bevel-angle': 'url(#outline-out-lightA3_azimuth:45)',
        'layer-blend-mode': 'url(#outline-out-dark-glass_blend-mode:multiply)',
        'text-effects-color-1': '#000000',
        'text-effects-color-2': '#000000',
      },
      cssProperties: {
        textTransform: 'none',
        fontStyle: 'italic',
        fontFamily: 'enfonix',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'shook-beyond': {
    componentType: 'wixEditorElements.TextEffectsShook',
    friendlyName: 'Beyond',
    thumbnail: {
      asset: getTextEffectAssetUrl('shook-beyond.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsShook.Style',
      cssCustomProperties: {
        'text-effects-color-3': '#B7BFFF',
        stroke: '#FFFFFF',
        'text-effects-color-2': '#002DFF',
        'text-effects-color-5': '#E8EBFF',
        'text-effects-color-1': '#447CFF',
        'bevel-angle': '315deg',
        'text-effects-color-4': '#C1CAFF',
        'layer-count': '5',
        'layer-spacing': '30',
        'stroke-width': '1px',
      },
      cssProperties: {
        textTransform: 'uppercase',
        textAlign: 'center',
        fontFamily: 'fahkwang',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '700',
      },
    },
  },
  'letterpress-matte': {
    componentType: 'wixEditorElements.TextEffectsLetterPress',
    friendlyName: 'Matte',
    thumbnail: {
      asset: getTextEffectAssetUrl('letterpress-matte.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsLetterPress.Style',
      cssCustomProperties: {
        'layer-blend-mode': 'normal',
        fill: '#FFFFFF',
        'fill-opacity': '0.2',
        'text-shadow': '-1.65px 0px 2.56px rgba(255, 255, 255, 0.5)',
      },
      cssProperties: {
        textTransform: 'capitalize',
        fontFamily: 'syne-extrabold',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'sticker-fluffy': {
    componentType: 'wixEditorElements.TextEffectsSticker',
    friendlyName: 'Fluffy',
    thumbnail: {
      asset: getTextEffectAssetUrl('sticker-fluffy.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsSticker.Style',
      cssCustomProperties: {
        'fill-opacity': '1',
        'outer-stroke-angle': '106deg',
        'shadow-opacity': '1',
        'shadow-distance': '14',
        stroke: '#FFFFFF',
        'outer-stroke-distance': '3',
        'shadow-blur': '32',
        fill: '#63FF4F',
        'shadow-color': '#63FF4F',
        'shadow-angle': '90deg',
        'stroke-width': '16px',
      },
      cssProperties: {
        fontFamily: 'avatar',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'glass-bouncy': {
    componentType: 'wixEditorElements.TextEffectsGlass',
    friendlyName: 'Bouncy',
    thumbnail: {
      asset: getTextEffectAssetUrl('glass-bouncy.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsGlass.Style',
      cssCustomProperties: {
        stroke: '#c19288',
        'text-color': '#FFE100',
        'shadow-blur': 'url(#glass-shadow_blur:5)',
        'shadow-color': '#FFE700',
        'stroke-width': '6px',
      },
      cssProperties: {
        fontStyle: 'italic',
        textAlign: 'center',
        fontFamily: 'vag-rounded-next',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'glass-cloudy': {
    componentType: 'wixEditorElements.TextEffectsGlass',
    friendlyName: 'Cloudy',
    thumbnail: {
      asset: getTextEffectAssetUrl('glass-cloudy.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsGlass.Style',
      cssCustomProperties: {
        stroke: '#D2F1FF',
        'text-color': '#87C9F3',
        'shadow-blur': 'url(#glass-shadow_blur:2)',
        'shadow-color': '#42B5FF',
        'stroke-width': '14px',
      },
      cssProperties: {
        fontStyle: 'italic',
        fontFamily: 'oktah-round',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '700',
      },
    },
  },
  'glitch-squish': {
    componentType: 'wixEditorElements.TextEffectsGlitch',
    friendlyName: 'Squish',
    thumbnail: {
      asset: getTextEffectAssetUrl('glitch-squish.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsGlitch.Style',
      cssCustomProperties: {
        'text-effects-color-3': '#FF3D00',
        'disable-inner-animation': 'initial',
        'text-effects-color-2': '#d0cbeb',
        'inner-animation-speed': '8',
        'shadow-blur': '0',
        'text-effects-color-1': '#FFFFFF',
        'layer-angle': '53deg',
        'layer-distance': '12',
      },
      cssProperties: {
        textTransform: 'uppercase',
        fontStyle: 'normal',
        fontFamily: 'modak',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: 'normal',
      },
    },
  },
  'retro-celebrate': {
    componentType: 'wixEditorElements.TextEffectsRetro',
    friendlyName: 'Celebrate',
    thumbnail: {
      asset: getTextEffectAssetUrl('retro-celebrate.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsRetro.Style',
      cssCustomProperties: {
        'text-effects-color-3': '#FC0C84',
        'disable-inner-animation': 'initial',
        'text-effects-color-2': '#FC0C84',
        'inner-animation-speed': '18',
        'shadow-blur': '2',
        'text-effects-color-1': '#FFEBF8',
        'bevel-angle': '262deg',
        'bevel-depth': '10',
        'text-effects-color-4': '#FC0C84',
        'layer-count': '4',
      },
      cssProperties: {
        textTransform: 'capitalize',
        fontStyle: 'normal',
        fontFamily: 'dancingscript-regular',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'glass-glaze': {
    componentType: 'wixEditorElements.TextEffectsGlass',
    friendlyName: 'Glaze',
    thumbnail: {
      asset: getTextEffectAssetUrl('glass-glaze.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsGlass.Style',
      cssCustomProperties: {
        stroke: '#9B5EFF',
        'text-color': '#D3C3FF',
        'shadow-blur': 'url(#glass-shadow_blur:2)',
        'shadow-color': '#9478E2',
        'stroke-width': '2px',
      },
      cssProperties: {
        textTransform: 'uppercase',
        fontStyle: 'italic',
        fontFamily: 'climate-crisis',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'striped-blossom': {
    componentType: 'wixEditorElements.TextEffectsStriped',
    friendlyName: 'Blossom',
    thumbnail: {
      asset: getTextEffectAssetUrl('striped-blossom.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsStriped.Style',
      cssCustomProperties: {
        'stripe-angle': '225deg',
        'disable-inner-animation': 'initial',
        'text-effects-color-2': '#FF310F',
        'inner-animation-speed': '1',
        'stripe-size': '8spx',
        'text-effects-color-1': '#FFA086',
      },
      cssProperties: {
        fontStyle: 'normal',
        fontFamily: 'gaude',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'striped-level-up': {
    componentType: 'wixEditorElements.TextEffectsStriped',
    friendlyName: 'Level Up',
    thumbnail: {
      asset: getTextEffectAssetUrl('sticker-level-up.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsStriped.Style',
      cssCustomProperties: {
        'stripe-angle': '270deg',
        'disable-inner-animation': 'initial',
        'text-effects-color-2': '#FF00F6',
        'inner-animation-speed': '1',
        'stripe-size': '400spx',
        'text-effects-color-1': '#36FDFF',
      },
      cssProperties: {
        fontStyle: 'italic',
        fontFamily: 'press-start-2p',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'sticker-night': {
    componentType: 'wixEditorElements.TextEffectsSticker',
    friendlyName: 'Night',
    thumbnail: {
      asset: getTextEffectAssetUrl('sticker-night.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsSticker.Style',
      cssCustomProperties: {
        'fill-opacity': '1',
        'outer-stroke-angle': '0deg',
        'shadow-opacity': '1',
        'shadow-distance': '8',
        stroke: '#2A183E',
        'outer-stroke-distance': '0',
        'shadow-blur': '0',
        fill: '#B633FF',
        'shadow-color': '#2A183E',
        'shadow-angle': '127deg',
        'stroke-width': '9px',
      },
      cssProperties: {
        textTransform: 'uppercase',
        fontStyle: 'normal',
        fontFamily: 'gaude',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'letterpress-change': {
    componentType: 'wixEditorElements.TextEffectsLetterPress',
    friendlyName: 'Change',
    thumbnail: {
      asset: getTextEffectAssetUrl('letterpress-change.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsLetterPress.Style',
      cssCustomProperties: {
        'layer-blend-mode': 'normal',
        fill: '#FFFFFF',
        'fill-opacity': '0.2',
        'text-shadow': '0.36px 0.65px 0.64px rgba(255, 255, 255, 0.8)',
      },
      cssProperties: {
        textTransform: 'uppercase',
        fontFamily: 'benzin',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: 'normal',
      },
    },
  },
  'glass-refined': {
    componentType: 'wixEditorElements.TextEffectsGlass',
    friendlyName: 'Refined',
    thumbnail: {
      asset: getTextEffectAssetUrl('glass-refined.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsGlass.Style',
      cssCustomProperties: {
        stroke: '#fff',
        'text-color': '#000',
        'shadow-blur': 'url(#glass-shadow_blur:3)',
        'shadow-color': '#3d3d3d',
        'stroke-width': '6px',
      },
      cssProperties: {
        textTransform: 'none',
        fontStyle: 'italic',
        textAlign: 'center',
        fontFamily: 'ogg',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '700',
      },
    },
  },
  'noisy-organic': {
    componentType: 'wixEditorElements.TextEffectsNoisy',
    friendlyName: 'Organic',
    thumbnail: {
      asset: getTextEffectAssetUrl('noisy-organic.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsNoisy.Style',
      cssCustomProperties: {
        'text-effects-color-1': '#228442',
        'squiggly-level': 'url(#noisy_squiggly:7)',
      },
      cssProperties: {
        fontFamily: 'feonie',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'neon-sign-cosmic': {
    componentType: 'wixEditorElements.TextEffectsNeonSign',
    friendlyName: 'Cosmic',
    thumbnail: {
      asset: getTextEffectAssetUrl('neon-sign-cosmic.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsNeonSign.Style',
      cssCustomProperties: {
        'shadow-opacity': '0.5',
        'disable-inner-animation': 'initial',
        'text-color': '#fff',
        'inner-animation-speed': '4',
        'shadow-blur': '0.5',
        'shadow-color': '#0052ff',
      },
      cssProperties: {
        fontFamily: 'feonie',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'glass-frozen-comet': {
    componentType: 'wixEditorElements.TextEffectsGlass',
    friendlyName: 'Frozen - Comet',
    thumbnail: {
      asset: getTextEffectAssetUrl('glass-frozen-comet.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsGlass.Style',
      cssCustomProperties: {
        stroke: '#FFFFFF',
        'text-color': '#FF6C6C',
        'shadow-blur': 'url(#glass-shadow_blur:4)',
        'shadow-color': '#F78461',
        'stroke-width': '1px',
      },
      cssProperties: {
        textTransform: 'none',
        fontStyle: 'italic',
        textAlign: 'center',
        fontFamily: 'tusker-grotesk-ultra-condensed',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'striped-direct': {
    componentType: 'wixEditorElements.TextEffectsStriped',
    friendlyName: 'Direct',
    thumbnail: {
      asset: getTextEffectAssetUrl('striped-direct.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsStriped.Style',
      cssCustomProperties: {
        'stripe-angle': '270deg',
        'disable-inner-animation': 'none',
        'text-effects-color-2': '#000',
        'inner-animation-speed': '1',
        'stripe-size': '7spx',
        'text-effects-color-1': '#fff',
      },
      cssProperties: {
        fontFamily: 'ogg',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: 'normal',
      },
    },
  },
  'outline-out-dreamy': {
    componentType: 'wixEditorElements.TextEffectsOutlineOut',
    friendlyName: 'Dreamy',
    thumbnail: {
      asset: getTextEffectAssetUrl('outline-out-dreamy.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsOutlineOut.Style',
      cssCustomProperties: {
        'bevel-angle': 'url(#outline-out-lightA3_azimuth:135)',
        'layer-blend-mode': 'url(#outline-out-dark-glass_blend-mode:multiply)',
        'text-effects-color-1': '#80623B',
        'text-effects-color-2': '#80623B',
      },
      cssProperties: {
        fontStyle: 'italic',
        fontFamily: 'marzo-w00-regular',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'outline-out-outline': {
    componentType: 'wixEditorElements.TextEffectsOutlineOut',
    friendlyName: 'Outline',
    thumbnail: {
      asset: getTextEffectAssetUrl('outline-out-outline.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsOutlineOut.Style',
      cssCustomProperties: {
        'bevel-angle': 'url(#outline-out-lightA3_azimuth:45)',
        'text-effects-color-1': '#B69067',
        'text-effects-color-2': '#B69067',
      },
      cssProperties: {
        fontStyle: 'italic',
        fontFamily: 'holy-river',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'shook-skate': {
    componentType: 'wixEditorElements.TextEffectsShook',
    friendlyName: 'Skate',
    thumbnail: {
      asset: getTextEffectAssetUrl('shook-skate.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsShook.Style',
      cssCustomProperties: {
        'text-effects-color-3': '#FF4300',
        stroke: '#0764FF',
        'text-effects-color-2': '#0764FF',
        'text-effects-color-5': '#FF4300',
        'text-effects-color-1': '#FFE426',
        'bevel-angle': '236deg',
        'text-effects-color-4': '#978954',
        'layer-count': '3',
        'layer-spacing': '27',
        'stroke-width': '9px',
      },
      cssProperties: {
        fontStyle: 'italic',
        fontFamily: 'wix-madefor-text-v2',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '600',
      },
    },
  },
  'retro-gentle': {
    componentType: 'wixEditorElements.TextEffectsRetro',
    friendlyName: 'Gentle',
    thumbnail: {
      asset: getTextEffectAssetUrl('retro-gentle.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsRetro.Style',
      cssCustomProperties: {
        'text-effects-color-3': '#c2d9f6',
        'disable-inner-animation': 'initial',
        'text-effects-color-2': '#aecdec',
        'inner-animation-speed': '18',
        'shadow-blur': '0',
        'text-effects-color-1': '#005ECB',
        'bevel-angle': '270deg',
        'bevel-depth': '24',
        'text-effects-color-4': '#e0efff',
        'layer-count': '4',
      },
      cssProperties: {
        textTransform: 'uppercase',
        fontFamily: 'bodoni-moda',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: 'normal',
      },
    },
  },
  'striped-antenna': {
    componentType: 'wixEditorElements.TextEffectsStriped',
    friendlyName: 'Antenna',
    thumbnail: {
      asset: getTextEffectAssetUrl('striped-antenna.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsStriped.Style',
      cssCustomProperties: {
        'stripe-angle': '225deg',
        'disable-inner-animation': 'initial',
        'text-effects-color-2': '#656565',
        'inner-animation-speed': '1',
        'stripe-size': '129spx',
        'text-effects-color-1': '#BDBDBD',
      },
      cssProperties: {
        fontStyle: 'italic',
        fontFamily: 'kelly slab',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'shook-disco': {
    componentType: 'wixEditorElements.TextEffectsShook',
    friendlyName: 'Disco',
    thumbnail: {
      asset: getTextEffectAssetUrl('shook-disco.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsShook.Style',
      cssCustomProperties: {
        'text-effects-color-3': '#D0FDFF',
        stroke: '#EE74C3',
        'text-effects-color-2': '#FF7357',
        'text-effects-color-5': '#FFDF8B',
        'text-effects-color-1': '#FFFFFF',
        'bevel-angle': '315deg',
        'text-effects-color-4': '#DAFBAC',
        'layer-count': '5',
        'layer-spacing': '41',
        'stroke-width': '4px',
      },
      cssProperties: {
        textTransform: 'uppercase',
        textAlign: 'center',
        fontFamily: 'gaude',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'glass-turbo': {
    componentType: 'wixEditorElements.TextEffectsGlass',
    friendlyName: 'Turbo',
    thumbnail: {
      asset: getTextEffectAssetUrl('glass-turbo.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsGlass.Style',
      cssCustomProperties: {
        stroke: '#FFECE1',
        'text-color': '#BC9331',
        'shadow-blur': 'url(#glass-shadow_blur:4)',
        'shadow-color': '#FFC101',
        'stroke-width': '10px',
      },
      cssProperties: {
        fontStyle: 'italic',
        fontFamily: 'press-start-2p',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'glass-core': {
    componentType: 'wixEditorElements.TextEffectsGlass',
    friendlyName: 'Core',
    thumbnail: {
      asset: getTextEffectAssetUrl('glass-core.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsGlass.Style',
      cssCustomProperties: {
        stroke: '#008dff',
        'text-color': '#6CAFCE',
        'shadow-blur': 'url(#glass-shadow_blur:7)',
        'shadow-color': '#2266ea',
        'stroke-width': '1px',
      },
      cssProperties: {
        fontStyle: 'normal',
        fontFamily: 'winner-college',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'sticker-point': {
    componentType: 'wixEditorElements.TextEffectsSticker',
    friendlyName: 'Point',
    thumbnail: {
      asset: getTextEffectAssetUrl('sticker-point.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsSticker.Style',
      cssCustomProperties: {
        'fill-opacity': '1',
        'outer-stroke-angle': '167deg',
        'shadow-opacity': '1',
        'shadow-distance': '6',
        stroke: '#FFFFFF',
        'outer-stroke-distance': '6',
        'shadow-blur': '0',
        fill: '#0040FF',
        'shadow-color': '#90BAFF',
        'shadow-angle': '148deg',
        'stroke-width': '8px',
      },
      cssProperties: {
        fontFamily: 'press-start-2p',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'bauhaus-direct': {
    componentType: 'wixEditorElements.TextEffectsBauhaus',
    friendlyName: 'Direct',
    thumbnail: {
      asset: getTextEffectAssetUrl('bauhaus-direct.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsBauhaus.Style',
      cssCustomProperties: {
        'text-effects-color-3': '#B5C092',
        'shadow-distance': '6',
        'text-effects-color-2': '#0E0E0E',
        'layer-blend-mode': 'screen',
        'text-effects-color-1': '#7A756C',
        'bevel-angle': '69deg',
      },
      cssProperties: {
        textTransform: 'uppercase',
        fontStyle: 'italic',
        textAlign: 'center',
        fontFamily: 'digital',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'matrix-funk': {
    componentType: 'wixEditorElements.TextEffectsMatrix',
    friendlyName: 'Funk',
    thumbnail: {
      asset: getTextEffectAssetUrl('matrix-funk.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsMatrix.Style',
      cssCustomProperties: {
        'disable-inner-animation': 'initial',
        'mask-position': '1',
        'inner-animation-speed': '7',
        'text-effects-color-1': '#7ED3D6',
        'mask-blur': '1',
        'text-blur': '1',
      },
      cssProperties: {
        textAlign: 'center',
        fontFamily: 'suez one',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'bauhaus-glow': {
    componentType: 'wixEditorElements.TextEffectsBauhaus',
    friendlyName: 'Glow',
    thumbnail: {
      asset: getTextEffectAssetUrl('bauhaus-glow.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsBauhaus.Style',
      cssCustomProperties: {
        'text-effects-color-3': '#000cff',
        'shadow-distance': '6',
        'text-effects-color-2': '#45ff00',
        'layer-blend-mode': 'screen',
        'text-effects-color-1': '#f00',
        'bevel-angle': '180deg',
      },
      cssProperties: {
        textTransform: 'uppercase',
        fontStyle: 'normal',
        textAlign: 'center',
        fontFamily: 'neue-haas-grotesk-display-pro',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '700',
      },
    },
  },
  '3d-friction': {
    componentType: 'wixEditorElements.TextEffects3d',
    friendlyName: 'Friction',
    thumbnail: {
      asset: getTextEffectAssetUrl('3d-friction.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffects3d.Style',
      cssCustomProperties: {
        'text-fill': '#fff',
        'text-shadow-3': '0px 0px 0px #60bfeb',
        'stroke-opacity': '100%',
        'text-shadow-1': '0px 2px 3px #0219AA',
        'text-shadow-2': '1px 2px 2px rgba(6, 85, 255, 0.31)',
        'text-fill-opacity': '100%',
        'stroke-color': '#fff',
        'stroke-width': '3px',
      },
      cssProperties: {
        fontStyle: 'italic',
        fontFamily: 'midnight-terror',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'noisy-blurry': {
    componentType: 'wixEditorElements.TextEffectsNoisy',
    friendlyName: 'Blurry',
    thumbnail: {
      asset: getTextEffectAssetUrl('noisy-blurry.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsNoisy.Style',
      cssCustomProperties: {
        'text-effects-color-1': '#000000',
        'squiggly-level': 'url(#noisy_squiggly:7)',
      },
      cssProperties: {
        textTransform: 'uppercase',
        fontStyle: 'italic',
        fontFamily: 'monoton',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  '3d-shine': {
    componentType: 'wixEditorElements.TextEffects3d',
    friendlyName: 'Shine',
    thumbnail: {
      asset: getTextEffectAssetUrl('3d-shine.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffects3d.Style',
      cssCustomProperties: {
        'text-fill': '#00ff32',
        'text-shadow-3': '0px 0px 12px #13ff00',
        'stroke-opacity': '1',
        'text-shadow-1': '0px 2px 0px rgba(0, 0, 0, 0)',
        'text-shadow-2': '0px 2px 1px rgba(0, 0, 0, 0)',
        'text-fill-opacity': '1',
        'stroke-color': '#2ac14d',
        'stroke-width': '1px',
      },
      cssProperties: {
        textTransform: 'none',
        fontStyle: 'italic',
        fontFamily: 'bandito-script',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'glass-flare': {
    componentType: 'wixEditorElements.TextEffectsGlass',
    friendlyName: 'Flare',
    thumbnail: {
      asset: getTextEffectAssetUrl('glass-flare.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsGlass.Style',
      cssCustomProperties: {
        stroke: '#FF00F6',
        'text-color': '#FF00F6',
        'shadow-blur': 'url(#glass-shadow_blur:2)',
        'shadow-color': '#0043FF',
        'stroke-width': '4px',
      },
      cssProperties: {
        textTransform: 'uppercase',
        fontStyle: 'italic',
        fontFamily: 'p22-posada',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'letterpress-echo': {
    componentType: 'wixEditorElements.TextEffectsLetterPress',
    friendlyName: 'Echo',
    thumbnail: {
      asset: getTextEffectAssetUrl('letterpress-echo.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsLetterPress.Style',
      cssCustomProperties: {
        'layer-blend-mode': 'normal',
        fill: '#FFFFFF',
        'fill-opacity': '0.2',
        'text-shadow': '1.3px 0.82px 0.8px rgba(255, 255, 255, 0.5)',
      },
      cssProperties: {
        textTransform: 'uppercase',
        fontFamily: 'bodoni-w01-poster',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'noisy-hollow': {
    componentType: 'wixEditorElements.TextEffectsNoisy',
    friendlyName: 'Hollow',
    thumbnail: {
      asset: getTextEffectAssetUrl('noisy-hollow.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsNoisy.Style',
      cssCustomProperties: {
        'text-effects-color-1': '#3B6133',
        'squiggly-level': 'url(#noisy_squiggly:6)',
      },
      cssProperties: {
        textTransform: 'capitalize',
        fontFamily: 'eschaton',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'outline-out-hyper': {
    componentType: 'wixEditorElements.TextEffectsOutlineOut',
    friendlyName: 'Hyper',
    thumbnail: {
      asset: getTextEffectAssetUrl('outline-out-hyper.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsOutlineOut.Style',
      cssCustomProperties: {
        'bevel-angle': 'url(#outline-out-lightA3_azimuth:45)',
        'layer-blend-mode': 'url(#outline-out-dark-glass_blend-mode:multiply)',
        'text-effects-color-1': '#000000',
        'text-effects-color-2': '#000000',
      },
      cssProperties: {
        textTransform: 'none',
        fontStyle: 'italic',
        fontFamily: 'ca-smut',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'noisy-breeze': {
    componentType: 'wixEditorElements.TextEffectsNoisy',
    friendlyName: 'Breeze',
    thumbnail: {
      asset: getTextEffectAssetUrl('noisy-breeze.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsNoisy.Style',
      cssCustomProperties: {
        'text-effects-color-1': '#806230',
        'squiggly-level': 'url(#noisy_squiggly:7)',
      },
      cssProperties: {
        fontFamily: 'zing-rust',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'glass-moment': {
    componentType: 'wixEditorElements.TextEffectsGlass',
    friendlyName: 'Moment',
    thumbnail: {
      asset: getTextEffectAssetUrl('glass-moment.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsGlass.Style',
      cssCustomProperties: {
        stroke: '#000',
        'text-color': '#000',
        'shadow-blur': 'url(#glass-shadow_blur:2)',
        'shadow-color': '#363636',
        'stroke-width': '4px',
      },
      cssProperties: {
        textTransform: 'capitalize',
        fontStyle: 'italic',
        fontFamily: 'unifrakturmaguntia',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
  'glass-noise': {
    componentType: 'wixEditorElements.TextEffectsGlass',
    friendlyName: 'Noise',
    thumbnail: {
      asset: getTextEffectAssetUrl('glass-noise.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsGlass.Style',
      cssCustomProperties: {
        stroke: '#A3E50B',
        'text-color': '#A3E50B',
        'shadow-blur': 'url(#glass-shadow_blur:2)',
        'shadow-color': '#A3E50B',
        'stroke-width': '7px',
      },
      cssProperties: {
        textTransform: 'uppercase',
        fontStyle: 'normal',
        fontFamily: 'benzin',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '700',
      },
    },
  },
  '3d-smash': {
    componentType: 'wixEditorElements.TextEffects3d',
    friendlyName: 'Smash',
    thumbnail: {
      asset: getTextEffectAssetUrl('3d-smash.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffects3d.Style',
      cssCustomProperties: {
        'text-fill': '#5205FF',
        'text-shadow-3': '0px 0px 10px #5205FF',
        'stroke-opacity': '1',
        'text-shadow-1': '0px 0px 5px #ff00000d',
        'text-shadow-2': '0px 0px 4px #5205FF',
        'text-fill-opacity': '1',
        'stroke-color': '#460EC6',
        'stroke-width': '1px',
      },
      cssProperties: {
        textTransform: 'none',
        fontStyle: 'italic',
        fontFamily: 'ogg',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '700',
      },
    },
  },
  'bauhaus-stellar': {
    componentType: 'wixEditorElements.TextEffectsBauhaus',
    friendlyName: 'Stellar',
    thumbnail: {
      asset: getTextEffectAssetUrl('bauhaus-stellar.png'),
    },
    styles: {
      type: 'wixEditorElements.TextEffectsBauhaus.Style',
      cssCustomProperties: {
        'text-effects-color-3': '#FF9988',
        'shadow-distance': '6',
        'text-effects-color-2': '#00439A',
        'layer-blend-mode': 'screen',
        'text-effects-color-1': '#009DFF',
        'bevel-angle': '124deg',
      },
      cssProperties: {
        textTransform: 'capitalize',
        fontStyle: 'normal',
        textAlign: 'center',
        fontFamily: 'pirata-one',
        letterSpacing: '0em',
        lineHeight: '1.2em',
        fontWeight: '400',
      },
    },
  },
};

export function getTextEffectsComponentTypes(): string[] {
  const componentTypes = new Set<string>();
  Object.values(TEXT_EFFECTS_PRESETS).forEach(preset => {
    componentTypes.add(preset.componentType);
  });
  return Array.from(componentTypes);
}

export function getTextEffectsPresetNames(): string[] {
  return Object.keys(TEXT_EFFECTS_PRESETS);
}

export const TEXT_EFFECTS_COMPONENT_OPTIONS: TextEffectsComponentOption[] =
  Object.entries(TEXT_EFFECTS_PRESETS).map(([presetName, preset]) => ({
    value: presetName,
    label: preset.friendlyName,
    thumbnail: preset.thumbnail,
  }));

export function getTextEffectsPresetComponentType(
  presetName: string,
): string | undefined {
  return TEXT_EFFECTS_PRESETS[presetName]?.componentType;
}

export function getTextEffectsComponentStyles(
  presetName: string,
): BuilderStyle | undefined {
  return TEXT_EFFECTS_PRESETS[presetName]?.styles;
}
