/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */


import java.util.Objects;


public class Key extends AbstractKey{

    // Class variables
    protected String key;
    public NoteList<String> ionian;
    public Quality mOrM;

    // constructor
    public Key(iPlay playAudio, String key) {
        super(playAudio);
        this.key = key;
        // temporarily set to null
        this.mOrM = null;

    }


    public NoteList<String> Ionian () {
        NoteList<String> Ionian = new NoteList<>(this.key);
        // set count to 1 for node with key
        Ionian.head.setCount(1);
        int total = 1;

        // steps for Ionian scale
        int[] steps = {1,0,1,0,1,1,0,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,0,1};
        boolean keyFound = false;
        int j = 1;

        // Search the chromatic scale for key then add notes according to steps
        for (int i = 0; i < Constants.getChromaticScale().getLength(); i++) {
            if (keyFound) {
                if (steps[j] == 1){
                    total++;
                    Ionian.addNode(Constants.getChromaticScale().getDataByIndex(i).getData());
                    // set the count for each note added to scale
                    Ionian.head.setCount(total);
                    if (total >= 8) break;
                }
                j++;
            }
            // set flag to true when key is found
            if (Objects.equals(Constants.getChromaticScale().getDataByIndex(i).getData(), key)) keyFound = true;
        }

        // if Ionian is not complete at the end of the chromatic scale, loop back to the beginning
        if (total < 8) {
            for (int i = 0; i <Constants.getChromaticScale().getLength(); i++) {
                if (steps[j] == 1){
                    total++;
                    Ionian.addNode(Constants.getChromaticScale().getDataByIndex(i).getData());
                    // set the count for added notes
                    Ionian.head.setCount(total);
                    if (total >= 8) break;
                }
                j++;
            }
        }
        return Ionian;
    }

    // Keys are either major or minor. "Perfect" is only for intervals of 4ths or 5th in harmony
    protected Quality mOrMSetter(int s) {
        if (s == 1 || s == 4 || s == 5) {
            return Quality.MAJOR;
        } else {
            return Quality.MINOR;
        }
    }
}
