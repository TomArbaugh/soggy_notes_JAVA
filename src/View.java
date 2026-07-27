/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */

import java.util.Scanner;

public class View {

    // scanner variable
    Scanner scanner;


    // constructor creates scanner for instance
    public View() {
        this.scanner = new Scanner(System.in);
    }

    public void readLine(String prompt) {
        // prints input
        System.out.println(prompt);
    }

    // receives String input from user
    public String readUserString() {
        return scanner.nextLine();
    }

    // receives Int input from user and trims next line
    public int readUserInt() {
        String line = scanner.nextLine();
        return Integer.parseInt(line.trim());
    }

}
