/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */

import java.util.function.Function;
import java.util.function.Predicate;

// ALl the methods in Node and EmptyNode

public interface iNode<T> {

    iNode<T> removeAtCondition(Predicate<T> predicate, GenLL<T> list);
    int counter(Predicate<T> predicate);
    iNode<T> getDataByIndex(int index);
    String toString();
    int length();
    T getData();
    void setCount(int c);
    iNode<T> filterByNodes(Predicate<iNode<T>> predicate);
    public int getCount();
    <R> iNode <R> nodeMap(Function<iNode<T>, R> function);
}
