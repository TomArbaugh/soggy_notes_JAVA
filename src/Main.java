/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */


import javafx.application.Application;

import java.util.Random;

public class Main  {


    public static void main(String[] args){
        // start the controller
        new Controller(new Random()).loop();
    }

}