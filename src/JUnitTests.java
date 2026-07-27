/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */

 import org.junit.Test;
 import org.junit.Before;
 import org.junit.Assert;
 import java.nio.file.Paths;
 import java.time.LocalDate;
 import java.util.Objects;

 import static org.junit.Assert.*;

public class JUnitTests {

     // Class variables for before each
     private Node<String> node;
     private GenLL<String> list;
     private GenLL<String> list2;
    private NoteList<String> noteList2;
     private Guess guess;
     private String base;
     private Harmony harmony;
     private Scale scale;


    // creates before each test
     @Before
     public void setUp() {
         node = new Node<>("Hello From Node", new EmptyNode<>());
        list = new GenLL<>();
        list2 = new GenLL<>(node);
         NoteList<String> noteList = new NoteList<>("Hello From NoteList");
        noteList2 = new NoteList<>(node);
        guess = new Guess();
        base = Paths.get(System.getProperty("user.dir"), "Samples/").toUri().toString();
         iPlay playAudio = new iPlay() {
             public String uri;
             public Runnable onEnd;

             @Override
             public void play() {
                 try {
                     java.nio.file.Path p = Paths.get(java.net.URI.create(uri));
                     new ProcessBuilder("afplay", p.toString()).inheritIO().start().waitFor();
                 } catch (Exception e) {
                     e.printStackTrace();
                 }
                 Runnable next = onEnd;
                 onEnd = null;
                 if (next != null) {
                     next.run();
                 }
             }

             @Override
             public void stop() {

             }

             @Override
             public void setSource(String uri) {
                 this.uri = uri;
             }

             @Override
             public void dispose() {

             }

             @Override
             public void setMediaCallBack(Runnable callback) {
                 this.onEnd = callback;
             }
         };
         Key key = new Key(playAudio, base + "C.m4a");
         scale = new Scale(playAudio, base + "C.m4a", 3);
         harmony = new Harmony(playAudio, base + "C.m4a", 2, Quality.MINOR);
     }

     // Testing One-Argument Constructor for GenLL
     @Test
     public void testOneArgumentGenLLConstructor() {
        assertEquals("List should have length 1", 1, list.getLength());
     }

    // Testing One-Argument (node) Constructor for GenLL
    @Test
    public void testWithNodeArgumentGenLLConstructor() {
        assertEquals("Data should say Hello", "Hello From Node", list2.getDataByIndex(0).getData());
    }


    // Test node map function
    @Test
    public void testNodeMap() {
        final int[] i = {0};
        scale.reverseIonian = scale.ionian.nodeMap(note ->
                scale.ionian.getDataByIndex(scale.ionian.getLength()-1 -i[0]++).getData());
        assertEquals("Double reverse equals the same", scale.reverseIonian.getDataByIndex(0).getData(), scale.ionian.getDataByIndex(0).getData());
    }

    // Test node filter function
    @Test
    public void testFilterNodes() {
        NoteList<String> C = scale.ionian.filterNodes(node -> node.getCount() ==1);
        assertEquals("Data should be C", base+"C.m4a", C.getDataByIndex(0).getData());
        assertEquals("Length should be 1", 1, C.getLength());
    }

    // Test fold counter function
    @Test
    public void testCallCounter() {
         Guess guess2 = new Guess();
        guess2.correct();
        guess2.correct();
        guess2.inCorrect();
        int wins = guess2.wins();
        int losses = guess2.losses();
        assertEquals("number correct should be 2", 2, wins);
        assertEquals("number of losses whould be 1", 1, losses);


        guess2.reset();
        wins = guess2.wins();
        losses = guess2.losses();
        assertEquals("number correct should be 0", 0, wins);
        assertEquals("number of losses whould be 0", 0, losses);
    }


    // test removing from a NoteList by index
    @Test
    public void testRemoveAtIndex() {
         NoteList<String> list3 = new NoteList<>("1");
         list3.addNode("2");
         list3.addNode("3");
         list3.removeAtIndex(1);
         assertEquals("length is 2", 2, list3.getLength());
         assertEquals("first is 1", "3", list3.getDataByIndex(0).getData());
         assertEquals("last is 3", "1", list3.getDataByIndex(1).getData());
    }

    // Test removing from a NoteList by condition
    @Test
    public void testRemoveAtCondition() {
        list.addNode("A");
        list.addNode("C");
        list.addNode("F");
        list.removeAtCondition(note -> Objects.equals(note, "C"));
        assertEquals("length is 2", 3, list.getLength());
        assertEquals("first is 1", "F", list.getDataByIndex(0).getData());
        assertEquals("last is 3", "A", list.getDataByIndex(1).getData());
    }

    // Test Guess constructor
    @Test
    public void testNoArgumentGuessConstructor() {
        assertEquals("no wins", 0, guess.wins());
        assertEquals("no losses", 0, guess.losses());
    }

    // Test Harmony constructor
    @Test
    public void testFourArgumentHarmonyConstructor() {
        assertNotNull(harmony);
    }

    // Test node constructor
    @Test
    public void testDataAndNodeArgumentNodeConstructor() {
        assertNotNull(node);
    }

    // test one-arg NoteList constructor
    @Test
    public void testOneArgumentNoteListConstructor() {
        assertEquals("Hello form list", "Hello From Node", noteList2.getDataByIndex(0).getData());
    }

    // Test constructor for starting NodeList with a node
    @Test
    public void testWithNodeArgumentNoteListConstructor() {
        assertEquals("Hello from added node", "Hello From Node", noteList2.getDataByIndex(0).getData());
    }

    // Test scale constructor
    @Test
    public void testThreeArgumentScaleConstructor() {
        assertNotNull(scale);
    }

 }
