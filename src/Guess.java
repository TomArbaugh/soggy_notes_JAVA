/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */

import java.time.LocalDate;

public class Guess {

    // Class variables
    private final GenLL<Integer> guesses;

    // Constructor
    public Guess() {
        this.guesses = new GenLL<Integer>();
        LocalDate today = LocalDate.now();
    }

    // A correct guess gets a 1
    public void correct() {

        this.guesses.addNode(1);
    }

    // An incorrect guess gets a 0
    public void inCorrect() {

        this.guesses.addNode(0);
    }

    // wins are the number of 1s
    public int wins() {

        return this.guesses.callCounter(guess -> guess!= null && guess == 1);
    }

    // losses are the number of 0s
    public int losses() {

        return this.guesses.callCounter(guess -> guess!= null && guess == 0);
    }

    // reset removes all the nodes keeping the scores
    public void reset() {
        this.guesses.removeAll();
    }
}
