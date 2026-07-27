/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */

import java.util.Objects;

public class Harmony extends Key{

    // class variables
    private final NoteList<String> aeolian;
    public NoteList<String> note;
    public Quality mOrM;


    // constructor including iPlay
    public Harmony(iPlay playAudio, String key, int interval, Quality mOrM) {
        super(playAudio, key);
        this.ionian = Ionian();
        this.aeolian = Aeolian();
        // if the interval is a 4th or a 5th the quality must be perfect
        this.mOrM = ((interval == 4) || (interval == 5)) ? Quality.PERFECT : mOrM;
        // helper function sets harmony to use validation
        this.note = harmonySetter(interval);

    }

    // Aeolian created and used for finding minor harmonies
    public NoteList<String> Aeolian () {
        NoteList<String> Aeolian= new NoteList<>(this.key);
        // Add key to list and set its count to 1
        Aeolian.head.setCount(1);
        int total = 1;
        // These are the steps to the aeolian scale
        int[] steps = {1,0,1,1,0,1,0,1,1,0,1,0,1,0,1};
        boolean keyFound = false;
        int j = 1;
        // look for the key root in the chromatic scale
        for (int i = 0; i < Constants.getChromaticScale().getLength(); i++) {
            if (keyFound) {
                // once we find it we can start building the aeolian scale by following the steps
                if (steps[j] == 1){
                    total++;
                    // add the note and set its count to total
                    Aeolian.addNode(Constants.getChromaticScale().getDataByIndex(i).getData());
                    Aeolian.head.setCount(total);
                    // done when scale reaches length of 8
                    if (total >= 8) break;
                }
                j++;
            }
            // set flag to true when key root is found
            if (Objects.equals(Constants.getChromaticScale().getDataByIndex(i).getData(), key)) keyFound = true;
        }

        // if scale not complete but end of chromatic scale has been reached, loop back to the beginning of chromatic scale
        if (total < 8) {
            for (int i = 0; i <Constants.getChromaticScale().getLength(); i++) {
                if (steps[j] == 1){
                    total++;
                    Aeolian.addNode(Constants.getChromaticScale().getDataByIndex(i).getData());
                    Aeolian.head.setCount(total);
                    if (total >= 8) break;
                }
                j++;
            }
        }
        return Aeolian;
    }

    // error handling for harmony ensuring only a 4th or 5th can be perfect
    private void harmonyError(int s) {
        if (s < 2 || s > 7) throw new IllegalArgumentException("Harmonies are between 2 and 7 scale degrees");
        switch (s) {
            case 2:
                if (this.mOrM == Quality.PERFECT) {
                    throw new IllegalArgumentException("2nds are not perfect!");
                }
                break;
            case 3:
                if (this.mOrM == Quality.PERFECT) {
                    throw new IllegalArgumentException("3rds are not perfect!");
                }
                break;
            case 4:
                if (this.mOrM != Quality.PERFECT) {
                    throw new IllegalArgumentException("All 4ths are perfect here!");
                }
                break;
            case 5:
                if (this.mOrM != Quality.PERFECT) {
                    throw new IllegalArgumentException("All 5ths are perfect here!");
                }
                break;
            case 6:
                if (this.mOrM == Quality.PERFECT) {
                    throw new IllegalArgumentException("6ths are not perfect!");
                }
                break;
            case 7:
                if (this.mOrM == Quality.PERFECT) {
                    throw new IllegalArgumentException("7ths are not perfect!");
                }
        }
    }

    // Sets harmony in the constructor implementing harmonyErrors
    public NoteList<String> harmonySetter(int s) {

        harmonyError(s);

        NoteList<String> scale;
        // special handling for minor 2nd because it's not in the aeolian scale
        if (s == 2 && this.mOrM == Quality.MINOR) {
            NoteList<String> c = Constants.getChromaticScale();
            int count = 0;
            // finds the count of the note one after the key root in the chromatic scale (minor second)
            for (int i = c.getLength() -1; i >= 0; i--) {
                if (Objects.equals(c.getDataByIndex(i).getData(), this.key)) {
                    count = c.getDataByIndex(i).getCount();
                }
            }
            final int index = count +1;
            // returns the note (minor 2nd) by it's count
            return c.filterNodes(note -> note.getCount() == index);
        }

        // all other intervals use ionian for major or aeolian for minor
        if (this.mOrM == Quality.MAJOR){
            scale = this.ionian;
        } else {
            scale = this.aeolian;
        }
       return scale.filterNodes(note -> note.getCount() == s);
    }

    public void playHarmony() {
        playHarmonyAt(-1); // -1 means “play root first”
    }

    // method for implementing Java Media Player through iPlay
    private void playHarmonyAt(int index) {
        if (index < 0) {
            setSource(this.key);
            playAudio.setMediaCallBack(() -> playHarmonyAt(0));
            play();
            return;
        }
        if (index >= this.note.getLength()) {
            return;
        }
        String path = this.note.getDataByIndex(index).getData();
        setSource(path);
        playAudio.setMediaCallBack(() -> playHarmonyAt(index + 1));
        play();
    }

}
