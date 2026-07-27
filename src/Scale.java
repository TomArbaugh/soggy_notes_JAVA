/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */

import java.util.Objects;

public class Scale extends Key{

    // class variables
    public NoteList<String> ionian;
    public NoteList<String> scale;
    public Quality mOrM;
    public NoteList<String> reverseIonian;
    public NoteList<String> reverseScale;
    public NoteList<String> reversScaleArpegio;
    public NoteList<String> reversIonianArpegio;
    public NoteList<String> scaleArpegio;
    public NoteList<String> ionianArpegio;

    // constructor
    public Scale(iPlay playAudio, String key, int scale) {
        super(playAudio, key);
        this.key = key;
        this.ionian = Ionian();
        // scaleSetter includes validations
        this.scale = scaleSetter(scale);
        // retrieves only the counts that make up the arpegio
        this.ionianArpegio = this.ionian.filterNodes(node -> node.getCount() == 1 ||
                node.getCount() == 3 || node.getCount() == 5 || node.getCount() == 7);
        // retrieves only the counts that make up the arpegio
        this.scaleArpegio = this.scale.filterNodes(node -> node.getCount() == 1 ||
                node.getCount() == 3 || node.getCount() == 5 || node.getCount() == 7);
        // builds a new list starting with the last node and walking it's way back to the first
        final int[] i = {0};
        this.reverseIonian = this.ionian.nodeMap(note ->
            this.ionian.getDataByIndex(this.ionian.getLength()-1 -i[0]++).getData()
        );
        // builds a new list starting with the last node and walking it's way back to the first
        final int[] j = {0};
        this.reverseScale = this.scale.nodeMap(note ->
                this.scale.getDataByIndex(this.scale.getLength()-1 -j[0]++).getData()
        );
        // helper function to reverse arpegio because count is not preserved
        this.reversIonianArpegio = reversArpegio(this.reverseIonian);
        this.reversScaleArpegio = reversArpegio(this.reverseScale);
        // inherited from key
        this.mOrM = mOrMSetter(scale);
    }

    public NoteList<String> scaleSetter(int s) {
        // validations for possible scales
        if (s < 1 || s > 7) throw new IllegalArgumentException("Scales begin at scale degrees between 1 and 7");
        if (s == 1) return this.ionian;

        // last node is the root and degrees grow towards the end, so the end - s is the tonic of the mode s
        String root = this.ionian.getDataByIndex(this.ionian.getLength() -s).getData();

        // add tonic (root) and add count
        int total = 1;
        NoteList<String> scale = new NoteList<>(root);
        scale.head.setCount(1);

        // walk up the scale from the second note and add each note until scale complete
        for (int i = this.ionian.getLength() -s -1; i > 0; i--) {
            scale.addNode(this.ionian.getDataByIndex(i).getData());
            total++;
            scale.head.setCount(total);
            if (total >= 8) break;
        }
        // if scale not complete by end of the ionian restart at the beginning of ionian until complete
        if (total < 8) {
            for (int i = this.ionian.getLength() -1; i >= 0; i--) {
                scale.addNode(this.ionian.getDataByIndex(i).getData());
                total++;
                scale.head.setCount(total);
                if (total >= 8) break;
            }
        }
        return scale;
    }

    // so scale can be called without callback
    public void playScale() {
        playScaleAction(this.scale.getLength() - 1, null);
    }

    // to play scale with callback
    public void playScale(Runnable onComplete) {
        playScaleAction(this.scale.getLength() - 1, onComplete);
    }

    // play each node using Java Media Player
    private void playScaleAction(int index, Runnable onComplete) {

        if (index < 0) {

            if (onComplete != null) onComplete.run();
            return;
        }
        String path = this.scale.getDataByIndex(index).getData();
        setSource(path);
        playAudio.setMediaCallBack(() -> playScaleAction(index - 1, onComplete));
        play();
    }

    // same as playScale and playScaleAction but for arpegio
    public void playArpeggio() {
        playArpeggioAt(this.scaleArpegio, this.scaleArpegio.getLength() - 1, null);
    }
    private void playArpeggioAt(NoteList<String> arp, int index, Runnable onComplete) {
        if (index < 0) {
            if (onComplete != null) {
                onComplete.run();
            }
            return;
        }
        String path = arp.getDataByIndex(index).getData();
        setSource(path);
        playAudio.setMediaCallBack(() -> playArpeggioAt(arp, index - 1, onComplete));
        play();
    }

    // reverses an arpegio
    public NoteList<String> reversArpegio (NoteList<String> scale) {
        int count = 0;
        // iterate through the scale and add the arpegio notes so they order in reverse
        NoteList<String> returnList = new NoteList<>(this.scale.getDataByIndex(1).getData());
        for (int i = 0; i < scale.getLength(); i++){
            if (count == 3 || count == 5 || count == 7){
                returnList.addNode(this.scale.getDataByIndex(i).getData());
            }
            count++;
        }
        return returnList;
    }

    // remove the 3rd and 7th to guess without the tones that denote major or minor
    public void removeGuidTones() {
        int count = 1;
        String three = "";
        String seven = "";
        // find the name of the 3rd and 7th
        for (int i = this.scale.getLength() -1; i >= 0; i--){
            if (count == 3 ) {
                three = this.scale.getDataByIndex(i).getData();
            }
            if (count == 7) {
                seven = this.scale.getDataByIndex(i).getData();
            }
            count++;
        }
        final String third = three;
        final String seventh = seven;
        // remove 3rd and 7th by name
        this.scale.removeAtCondition(note -> Objects.equals(note, third) || Objects.equals(note, seventh));
    }

    // remove all but the 3rd and 7th
    public void onlyGuidTones() {
        this.scale.removeAtIndex(7);
        this.scale.removeAtIndex(6);
        this.scale.removeAtIndex(4);
        this.scale.removeAtIndex(3);
        this.scale.removeAtIndex(2);
    }
}
