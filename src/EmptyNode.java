/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */

import java.util.function.Function;
import java.util.function.Predicate;

public class EmptyNode<T> implements iNode<T>{

    // returns this to ensure we check every node
    public iNode<T> removeAtCondition(Predicate<T> predicate, GenLL<T> list){
        return this;
    }

    // Contains this so conform to iNode
    public iNode<T> getDataByIndex(int index) {
        throw new IndexOutOfBoundsException();
    }

    public String toString() {
        return "Hello From Empty Node";
    }

    // Length is one
    public int length() {
        return 1;
    }

    // Empty node has no data
    public T getData() {
        return null;
    }

    // Empty node has nothing to count
    public int counter(Predicate<T> predicate) {
            return 0;
    }

    // sets count when creating scales
    public void setCount(int c) {

    }

    // filters nodes
    @Override
    public iNode<T> filterByNodes(Predicate<iNode<T>> predicate) {
        return new EmptyNode<>();
    }

    // returns count
    public int getCount() {
        return 0;
    }

    // maps a list of nodes
    public <R> iNode <R> nodeMap(Function<iNode<T>, R> function){return new EmptyNode<>();}
}
