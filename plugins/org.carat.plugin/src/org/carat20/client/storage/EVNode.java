package org.carat20.client.storage;

import java.io.Serializable;
import java.util.TreeSet;

/**
 * Simple EVNode implementation.
 * @author Jonatan Hamberg
 */
public class EVNode implements Comparable, Serializable {

    private EVNode parent;
    private String split;
    private Object value;
    private double ev;
    private double entropy;
    private double count;
    private double err;
    
    // Implement later as TreeMap<Object, EVNode>
    private final TreeSet<EVNode> children; 

    /**
     * Initializes an EVNode.
     */
    public EVNode() {
        children = new TreeSet<EVNode>();
    }

    /**
     * Adds a node to children.
     * @param node
     */
    public void addChild(EVNode node) {
        children.add(node);
    }

    /**
     * @return Entropy value
     */
    public double getEntropy() {
        return entropy;
    }

    /**
     * Sets an entropy value
     * @param entropy Entropy value
     */
    public void setEntropy(double entropy) {
        this.entropy = entropy;
    }

    /**
     * @return Child nodes
     */
    public TreeSet<EVNode> getChildren() {
        return children;
    }

    /**
     * @return Split name
     */
    public String getSplit() {
        return split;
    }

    /**
     * Sets a split name
     * @param splitName Split name
     */
    public void setSplit(String splitName) {
        this.split = splitName;
    }

    /**
     * @return Split value
     */
    public Object getValue() {
        return value;
    }

    /**
     * Sets a split value
     * @param splitValue Split value
     */
    public void setValue(Object splitValue) {
        this.value = splitValue;
    }

    /**
     * @return Expected value
     */
    public double getEv() {
        return ev;
    }

    /**
     * @return Parent node
     */
    public EVNode getParent() {
        return parent;
    }

    /**
     * Sets a parent node
     * @param parent Parent node
     */
    public void setParent(EVNode parent) {
        this.parent = parent;
    }

    /**
     * Sets an expected value
     * @param ev Expected value
     */
    public void setEv(double ev) {
        this.ev = ev;
    }

    /**
     * @return Count value
     */
    public double getCount() {
        return count;
    }

    /**
     * Sets a count value.
     * @param count Count value
     */
    public void setCount(double count) {
        this.count = count;
    }

    /**
     * @return Error value
     */
    public double getErr() {
        return err;
    }

    /**
     * Sets an error value.
     * @param err Error
     */
    public void setErr(double err) {
        this.err = err;
    }

    @Override
    public String toString() {
        return "EVNode{"
                + "parent=" + parent
                + ", children=" + children
                + ", splitName=" + split
                + ", splitValue=" + value
                + ", ev=" + ev + ", entropy="
                + entropy + ", count="
                + count + ", err="
                + err + '}';
    }

    /**
     * Makes EVNodes comparable by their expected value.
     * @param node EVNode to be compared
     * @return Negative, zero or positive integer
     */
    @Override
    public int compareTo(Object node) {
        return Double.compare(((EVNode) node).getEv(), this.getEv());
    }
}
