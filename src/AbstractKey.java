/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */

// Shared wiring for iPlay / iPlay facade

// Todo: create life cycle for overlapping play for chords
// Todo: make one helper function to replace playScaleAction and playHarmonyAt

public abstract class AbstractKey {
    // has iPlay attribute
    iPlay playAudio;

    // constructor
    public AbstractKey (iPlay playAudio) {

        this.playAudio = playAudio;
    }

    //------------------ Methods for iPlay wiring-----------------------------------
    public void setSource(String uri) {

        playAudio.setSource(uri);
    }

    public void play() {

        playAudio.play();
    }

    public void stop() {

        playAudio.stop();
    }

    public void dispose() {

        playAudio.dispose();
    }

}
