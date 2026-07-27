/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */

import java.util.function.Function;
import java.util.function.Predicate;

public class GenLL<T> {

    // Class variables (inherited by CustomClass)
    iNode<T> head;
    int length;

    // Constructor starting with data
    public GenLL(){
        this.head = new Node<>(null, new EmptyNode<>());
        this.length = 1;
    }

    // Constructor starting with a node
    public GenLL(iNode<T> data){
        this.head = data;
        this.length = 1;
    }

    // Add a node to the list
    public void addNode(T data) {
        head = new Node<>(data, head);
        this.length++;
    }

    // Override toString for printing list
    public String toString() {
        return head.toString() + " \n";
    }

    // Get the length of the list
    public int getLength() {
        return length;
    }

    // Get data by searching for it's index recursively
    public iNode<T> getDataByIndex(int index) {
        if (index < 0 || index >= length) throw new IndexOutOfBoundsException();

        return head.getDataByIndex(index);
    }

    // Generic Map function
    public <R> GenLL<R> nodeMap(Function<iNode<T>, R> function) {
        return new GenLL<>(head.nodeMap(function));
    }

    // Generic Filter by node
    public GenLL<T> filterNodes(Predicate<iNode<T>> predicate){
        return new GenLL<>(head.filterByNodes(predicate));
    }

    // Generic Fold / Counter
    public int callCounter(Predicate<T> predicate) {
        return head.counter(predicate);
    }

    // Method to remove a node at a chosen index
    public void removeAtIndex(int index){
        if (index < 0 || index >= length) throw new IndexOutOfBoundsException();
        if (index == 0) {
            head = ((Node<T>) head).nextNode;
        } else {
            Node<T> prev = (Node<T>)head.getDataByIndex(index-1);
            prev.nextNode = ((Node<T>) prev.nextNode).nextNode;
        }
        length--;
    }

    // Remove all the nodes that meet a certain condition (length decremented in Node)
    public void removeAtCondition(GenLL<T>this, Predicate<T> predicate){
        head = head.removeAtCondition(predicate, this);
    }

    // Remove all nodes
    public void removeAll(){
        head = new EmptyNode<>();
        length = 1;
    }

}
