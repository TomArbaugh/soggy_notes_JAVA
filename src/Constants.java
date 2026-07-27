/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */

import java.nio.file.Paths;

    public class Constants {

        // base for finding sample files
        private static String uri(String filename) {
            return Paths.get(System.getProperty("user.dir"), "Samples", filename).toUri().toString();
        }

        // returns chromatic scale as the foundation for creating all other scales
        public static NoteList<String> getChromaticScale() {
            NoteList<String> chromaticScale = new NoteList<>(uri("B.m4a"));
            chromaticScale.head.setCount(12);
            chromaticScale.addNode(uri("A#-Bb.m4a"));
            chromaticScale.head.setCount(11);
            chromaticScale.addNode(uri("A.m4a"));
            chromaticScale.head.setCount(10);
            chromaticScale.addNode(uri("G#-Ab.m4a"));
            chromaticScale.head.setCount(9);
            chromaticScale.addNode(uri("G.m4a"));
            chromaticScale.head.setCount(8);
            chromaticScale.addNode(uri("F#-Gb.m4a"));
            chromaticScale.head.setCount(7);
            chromaticScale.addNode(uri("F.m4a"));
            chromaticScale.head.setCount(6);
            chromaticScale.addNode(uri("E.m4a"));
            chromaticScale.head.setCount(5);
            chromaticScale.addNode(uri("D#-Eb.m4a"));
            chromaticScale.head.setCount(4);
            chromaticScale.addNode(uri("D.m4a"));
            chromaticScale.head.setCount(3);
            chromaticScale.addNode(uri("C#-Db.m4a"))
            ;chromaticScale.head.setCount(2);
            chromaticScale.addNode(uri("C.m4a"))
            ;chromaticScale.head.setCount(1);
            return chromaticScale;
        }
    }


