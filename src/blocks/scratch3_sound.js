class Scratch3SoundBlocks {
    constructor (runtime) {
        this.runtime = runtime;
    }

    static get STATE_KEY () { return 'Scratch.sound'; }
    static get DEFAULT_SOUND_STATE () { return { effects: { pitch: 0, pan: 0 } }; }
    static get MIDI_NOTE_RANGE () { return {min: 36, max: 96}; }
    static get BEAT_RANGE () { return {min: 0, max: 100}; }
    static get TEMPO_RANGE () { return {min: 20, max: 500}; }
    static get EFFECT_RANGE () { return { pitch: {min: -360, max: 360}, pan: {min: -100, max: 100} }; }
    static get LARGER_EFFECT_RANGE () { return { pitch: {min: -1000, max: 1000}, pan: {min: -100, max: 100} }; }

    getPrimitives () {
        return {
            sound_play: this.playSound,
            sound_playuntildone: this.playSoundAndWait,
            sound_stopallsounds: this.stopAllSounds,
            sound_seteffectto: this.setEffect,
            sound_changeeffectby: this.changeEffect,
            sound_cleareffects: this.clearEffects,
            sound_sounds_menu: this.soundsMenu,
            sound_beats_menu: this.beatsMenu,
            sound_effects_menu: this.effectsMenu,
            sound_setvolumeto: this.setVolume,
            sound_changevolumeby: this.changeVolume,
            sound_volume: this.getVolume
        };
    }

    getMonitored () {
        return {
            sound_volume: {
                isSpriteSpecific: true,
                getId: targetId => `${targetId}_volume`
            }
        };
    }

    playSound () {}
    playSoundAndWait () {}
    stopAllSounds () {}
    setEffect () {}
    changeEffect () {}
    clearEffects () {}
    soundsMenu () {}
    beatsMenu () {}
    effectsMenu () {}
    setVolume () {}
    changeVolume () {}
    getVolume () {}
}

module.exports = Scratch3SoundBlocks;
