package evtree;

import java.io.Serializable;
import java.util.TreeSet;
import utility.Range;

/**
 * Simple EVNode implementation.
 * @author Jonatan Hamberg
 */
public class EVNode implements Comparable<EVNode>, Serializable {
    
    // Properties
    private String split;
    private double ev;
    private double entropy;
    private double count;
    private double err;
    
    // Either is used as the value
    private String valueString;
    private Range valueRange;
    
    // Predecessor and successors
    private EVNode parent;
    private final TreeSet<EVNode> children; 

    /**
     * Initializes an EVNode.
     */
    public EVNode() {
        children = new TreeSet<>();
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
     * @return String value
     */
    public String getValueString() {
        return valueString;
    }

    /**
     * Sets a value string
     * @param valueString String value
     */
    public void setValueString(String valueString) {
        this.valueString = valueString;
    }

    /**
     * @return Range value
     */
    public Range getValueRange() {
        return valueRange;
    }

    /**
     * Sets a value range
     * @param valueRange
     */
    public void setValueRange(Range valueRange) {
        this.valueRange = valueRange;
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
        String value = valueString;
        if(value == null){
            value = valueRange.toString();
        }
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
    public int compareTo(EVNode node) {
        return Double.compare(node.getEv(), this.getEv());
    }
}
