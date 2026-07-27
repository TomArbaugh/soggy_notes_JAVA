/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 * */

import java.util.function.Function;
import java.util.function.Predicate;

public class NoteList<T> extends GenLL<T> {


        // Constructor starting with data
        public NoteList(T data){
            this.head = new Node<>(data, new EmptyNode<>());
            this.length = 1;
        }

        // Constructor starting with a node
        public NoteList(iNode<T> data){
            super(data);
            this.head = data;
            this.length = Math.max(0, head.length() - 1);
        }


        // Generic Map function
        public <R> NoteList<R> nodeMap(Function<iNode<T>, R> function) {
            return new NoteList<>(head.nodeMap(function));
        }

        // Generic Filter by node
        public NoteList<T> filterNodes(Predicate<iNode<T>> predicate){
            return new NoteList<>(head.filterByNodes(predicate));
        }

}
