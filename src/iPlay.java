/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */

import java.util.function.Function;
import java.util.function.Predicate;

// ALl the methods in Node and EmptyNode

public interface iPlay {
    void play();
    void stop();
    void setSource(String uri);
    void dispose();
    void setMediaCallBack(Runnable callback);

}
