const Cast = require('../util/cast');
const Clone = require('../util/clone');
const uid = require('../util/uid');
const StageLayering = require('../engine/stage-layering');
const getMonitorIdForBlockWithArgs = require('../util/get-monitor-id');
const MathUtil = require('../util/math-util');

/**
 * @typedef {object} BubbleState - the bubble state associated with a particular target.
 * @property {Boolean} onSpriteRight - tracks whether the bubble is right or left of the sprite.
 * @property {?int} drawableId - the ID of the associated bubble Drawable, null if none.
 * @property {string} text - the text of the bubble.
 * @property {string} type - the type of the bubble, "say" or "think"
 * @property {?string} usageId - ID indicating the most recent usage of the say/think bubble.
 *      Used for comparison when determining whether to clear a say/think bubble.
 */

class Scratch3LooksBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    getPrimitives () {
        return {
            looks_say: this.say,
            looks_sayforsecs: this.sayforsecs,
            looks_think: this.think,
            looks_thinkforsecs: this.thinkforsecs,
            looks_show: this.show,
            looks_hide: this.hide,
            looks_hideallsprites: () => {}, // legacy no-op block
            looks_switchcostumeto: this.switchCostume,
            looks_switchbackdropto: this.switchBackdrop,
            looks_switchbackdroptoandwait: this.switchBackdropAndWait,
            looks_nextcostume: this.nextCostume,
            looks_nextbackdrop: this.nextBackdrop,
            looks_changeeffectby: this.changeEffect,
            looks_seteffectto: this.setEffect,
            looks_cleargraphiceffects: this.clearEffects,
            looks_changesizeby: this.changeSize,
            looks_setsizeto: this.setSize,
            looks_changestretchby: () => {}, // legacy no-op blocks
            looks_setstretchto: () => {},
            looks_gotofrontback: this.goToFrontBack,
            looks_goforwardbackwardlayers: this.goForwardBackwardLayers,
            looks_size: this.getSize,
            looks_costumenumbername: this.getCostumeNumberName,
            looks_backdropnumbername: this.getBackdropNumberName
        };
    }

    getMonitored () {
        return {
            looks_size: {
                isSpriteSpecific: true,
                getId: targetId => `${targetId}_size`
            },
            looks_costumenumbername: {
                isSpriteSpecific: true,
                getId: (targetId, fields) => `${targetId}_costumenumbername`
            },
            looks_backdropnumbername: {
                getId: (_, fields) => `backdropnumbername`
            }
        };
    }

    say (args, util) {}
    sayforsecs (args, util) {}
    think (args, util) {}
    thinkforsecs (args, util) {}
    show (args, util) {}
    hide (args, util) {}
    switchCostume (args, util) {}
    nextCostume (args, util) {}
    switchBackdrop (args) {}
    switchBackdropAndWait (args, util) {}
    nextBackdrop () {}
    changeEffect (args, util) {}
    setEffect (args, util) {}
    clearEffects (args, util) {}
    changeSize (args, util) {}
    setSize (args, util) {}
    goToFrontBack (args, util) {}
    goForwardBackwardLayers (args, util) {}
    getSize (args, util) {}
    getBackdropNumberName (args) {}
    getCostumeNumberName (args, util) {}
}

module.exports = Scratch3LooksBlocks;
