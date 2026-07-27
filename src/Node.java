/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */

import java.util.function.Function;
import java.util.function.Predicate;

public class Node<T> implements iNode<T> {

    // Class variables
    public iNode<T> nextNode;
    private final T data;
    public int count;

    // Constructor with data and node
    public Node(T data, iNode<T> nextNode) {
        this.data = data;
        this.nextNode = nextNode;
        this.count = 0;
    }

    // Finds node by index recursively
    public iNode<T> getDataByIndex(int index) {
        if (index == 0) {
            return this;
        }
        index--;
        return nextNode.getDataByIndex(index);
    }

    // toString override
    public String toString() {
        if (nextNode != null) {
            return data.toString() + nextNode.toString();
        }
        return null;
    }

    // get length
    public int length() {
        return 1 + nextNode.length();
    }

    // get data
    public T getData() {
        return data;
    }

    public <R> iNode<R> nodeMap(Function<iNode<T>, R> function){
        return new Node<>(function.apply(this), nextNode.nodeMap(function));
    }

    // For filterNodes
    public iNode<T> filterByNodes (Predicate<iNode<T>> predicate){
        if (predicate.test(this)) {
            return new Node<>(data, nextNode.filterByNodes(predicate));
        } else {
            return nextNode.filterByNodes(predicate);
        }
    }

    // Full implementation of fold / counter
    public int counter(Predicate<T> predicate) {
        int count = predicate.test(data)? 1 : 0;

        return count + (nextNode == null? 0 : nextNode.counter(predicate));
    }

    // Full implementation of removing a node that meets a certain condition
    public iNode<T> removeAtCondition(Predicate<T> predicate, GenLL<T> list){
         if (predicate.test(this.getData())) {
             list.length--;
             return this.nextNode.removeAtCondition(predicate, list);
         }
         this.nextNode = this.nextNode.removeAtCondition(predicate, list);
         return this;
    }

    // sets the count for a node
    public void setCount(int c) {
        this.count = c;
    }

    // gets the count for a node
    public int getCount() {
        return this.count;
    }
}
