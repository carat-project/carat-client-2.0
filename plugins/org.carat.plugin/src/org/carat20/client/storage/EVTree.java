
package org.carat20.client.storage;

import android.util.Log;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.TreeSet;
import org.carat20.client.utility.Range;

/**
 * Simple EVTree implementation.
 * @author Jonatan Hamberg
 */
public class EVTree implements Serializable{

    EVNode root;

    /**
     * Initializes the tree.
     * @param root Root node
     */
    public EVTree(EVNode root) {
        this.root = root;
    }

    /**
     * @return Root node
     */
    public EVNode getRoot() {
        return root;
    }
    
    /**
     * Prints a tree of full depth.
     */
    public void print(){
        this.print(Integer.MAX_VALUE);
    }
    
    /**
     * Prints a tree of custom depth.
     * @param depth Depth of traversal
     */
    public void print(int depth) {
        print(root, "", depth);
    }
    
    
    /**
     * Gets a list of suggestions based on device information.
     * @param info Device information
     * @return List of suggestions
     */
    public SimpleSettings[] getSuggestions(HashMap<String, Object> info){
        List<SimpleSettings> results = new LinkedList<SimpleSettings>();
        
        // Loop through suggested nodes
        ArrayList<EVNode> suggestedNodes = this.getSuggestedNodes(info);
        for(EVNode node : suggestedNodes){
            SimpleSettings s = new SimpleSettings();
            s.setLabel(node.getSplit());
            s.setEntropy(node.getEntropy());
            s.setErr(node.getErr());
            s.setEv(node.getEv());
            s.setSamples(node.getCount());
            s.setValue(node.getValue());
            results.add(s);
        }
        
        return results.toArray(new SimpleSettings[results.size()]);
    }
        
    // Gets a list of suggested nodes
    public ArrayList<EVNode> getSuggestedNodes(HashMap<String, Object> info) {
        ArrayList<EVNode> suggestions = new ArrayList<EVNode>();
        EVNode node = root;
        TreeSet<EVNode> children;
        
        // Get children for current node
        while(!(children = node.getChildren()).isEmpty()){
            EVNode old = node;
            String currentSplit = children.first().getSplit();
            EVNode best = children.last();
            Object deviceValue = info.get(currentSplit); 
            
            // Todo, replace with children.get(deviceValue);
            for(EVNode child : children){
               Object nodeValue = child.getValue();
               
               String temp;
               if(nodeValue instanceof Range){
                   temp = ((Range) nodeValue).getMin() + "-" + ((Range) nodeValue).getMax();
                   if(deviceValue instanceof Integer){
                   }
               } else temp = (String) nodeValue;
               
               // Device value matches the node value
               if((nodeValue instanceof Range 
                       && deviceValue instanceof Integer
                       && ((Range) nodeValue).contains(((Integer) deviceValue)))
                       || (nodeValue instanceof String 
                       && deviceValue instanceof String 
                       && ((String) nodeValue).equalsIgnoreCase((String)deviceValue))){
                   
                   // Compare matching node to best
                   if(best.getEv() < child.getEv()){
                       suggestions.add(best);
                   }
                   // Traverse down
                   node = child;
                   break;
               } 
            }
            // No matching child found
            if(node == old) break;
        }
        
        return suggestions;
    }
    
    // Recursively prints the tree as a list
    private void print(EVNode root, String prefix, int depth){
        if(root == null || depth < 0) return;
        String splitValue;
        Object value = root.getValue();
        if(value instanceof Range){
            Range range = (Range) value;
            splitValue = "["+range.getMin()+","+range.getMax()+"]";
        } else {
            splitValue = (String) value;
        }
        System.out.println(prefix 
                + "+- " + root.getSplit() 
                + ": " + splitValue
                + " (" + root.getEv() + ")");
        for(EVNode child : root.getChildren()){
            print(child, prefix+"|  ", depth-1);
        }
    }
}