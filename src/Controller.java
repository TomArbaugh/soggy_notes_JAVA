/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */
import java.nio.file.Paths;
import java.util.Objects;
import java.util.Random;

public class Controller {

    // class variables
    public View view;
    public Guess guess;
    public Random random;
    public iPlay playAudio;


    // constructor
    public Controller(Random random) {
        // view is a new View
        this.view = new View();
        // guess is a new Guess (model)
        this.guess = new Guess();
        this.random = random;
        // iPlay with required functionality allows for Java Media Player to play
        this.playAudio = new iPlay() {
            public String uri;
            public Runnable onEnd;
            @Override
            public void play() {
                try {
                    java.nio.file.Path p = java.nio.file.Paths.get(java.net.URI.create(uri));
                    new ProcessBuilder("afplay", p.toString()).inheritIO().start().waitFor();
                } catch (Exception e) {
                    System.err.println("Playback failed: " + e.getMessage());
                    e.printStackTrace(System.err);
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
    }

    // Game loop
    public void loop() {
        // base for uri sample paths
        String base = Paths.get(System.getProperty("user.dir"), "Samples/").toUri().toString();
        // flag boolean
        boolean satisfied = false;
        // instantiated to "" to allow for creation within if block
        String root = "";

        // Opens inner loop to wait for correct input
        while (!satisfied) {
            view.readLine("Hello and welcome to ear training!");
            view.readLine("Please pick a key!");
            view.readLine("Options: A, B, C, D, E, F, G");

            root = view.readUserString();
            if (Objects.equals(root, "A")||
                    Objects.equals(root, "B") ||
                    Objects.equals(root, "C") ||
                    Objects.equals(root, "D") ||
                    Objects.equals(root, "E") ||
                    Objects.equals(root, "F") ||
                    Objects.equals(root, "G")
            ) {
                satisfied = true;
            } else {
                view.readLine("Please select a provided option!");
            }
        }

        // flag reset
        satisfied = false;
        int choice = 0;

        // Next loop waiting for correct input
        while (!satisfied) {
            view.readLine("Press 1 for Harmony, 2 for Scale, or 3 for Arpegio");

            choice = view.readUserInt();
            if (choice == 1 || choice == 2 || choice == 3) {
                satisfied = true;
            } else {
                view.readLine("Please select a provided option!");
            }
        }

        // choose a random scale
        int interval = random.nextInt(1, 8);
        // choose a random harmony
        int noRoot = random.nextInt(2, 8);
        Scale scale = new Scale(playAudio, base + root + ".m4a", interval);

        // new flag
        boolean correct = false;

        // different logic depending on if user chose scale, harmony, or arpegio
        switch (choice) {

            case 1:
                // random quality
                int quality = random.nextInt(1, 3);
                // if harmony is a 4th or a 5th it is perfect
                boolean isPerfect = noRoot == 4 || noRoot == 5;
                // create random harmony
                Harmony harmony = new Harmony(playAudio, base + root + ".m4a", noRoot, isPerfect ? Quality.PERFECT : quality == 1 ? Quality.MAJOR : Quality.MINOR);
                harmony.playHarmony();
                // Guess loop. Wait for right answer and keep track of guesses
                while (!correct) {
                    view.readLine("Please guess scale degree 2, 3, 4, 5, 6, or 7");
                    if (view.readUserInt() == noRoot) {
                        guess.correct();
                        correct = true;
                        view.readLine("Wins: " + guess.wins() + " " + "Losses " + guess.losses());
                    } else {
                        guess.inCorrect();
                        view.readLine("Please guess again");
                        view.readLine("Wins: " + guess.wins() + " " + "Losses " + guess.losses());
                    }
                }
                break;
            case 2:
                scale.playScale();
                // guess loop stays open until correct answer and keeps track of guesses
                while (!correct) {
                    view.readLine("Please guess mode 1 (Ionian), 2 (Dorian), 3 (Phrygian), 4 (Lydian), 5 (Mixolydian), 6 (Aeolian), or 7 (Locrian)");
                    if (view.readUserInt() == interval) {
                        guess.correct();
                        correct = true;
                        view.readLine("Wins: " + guess.wins() + " " + "Losses " + guess.losses());
                    } else {
                        guess.inCorrect();
                        view.readLine("Please guess again");
                        view.readLine("Wins: " + guess.wins() + " " + "Losses " + guess.losses());
                    }
                }
                break;
            case 3:
                scale.playArpeggio();
                // guess loop stays open until correct answer and keeps track of guesses
                while (!correct) {
                    view.readLine("Please guess mode 1 (Ionian), 2 (Dorian), 3 (Phrygian), 4 (Lydian), 5 (Mixolydian), 6 (Aeolian), or 7 (Locrian)");
                    if (view.readUserInt() == interval) {
                        guess.correct();
                        correct = true;
                        view.readLine("Wins: " + guess.wins() + " " + "Losses " + guess.losses());
                    } else {
                        guess.inCorrect();
                        view.readLine("Please guess again ");
                        view.readLine("Wins: " + guess.wins() + " " + "Losses " + guess.losses());
                    }
                }
        }

        // prompts to keep going or to end
        view.readLine("Would you like to try another one?");
        view.readLine("Press 1 to keep going or 0 to reset");
        if (view.readUserInt() == 1) {
            loop();
        } else {
            guess.reset();
        }

    }

}
