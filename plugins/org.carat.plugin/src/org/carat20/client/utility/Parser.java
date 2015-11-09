package org.carat20.client.utility;
import android.util.Log;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.URL;
import java.util.HashMap;
import java.util.Scanner;
import org.carat20.client.storage.EVNode;
import org.carat20.client.storage.EVTree;

/**
 * Parser for logfiles containing EVTrees.
 * @author Jonatan Hamberg
 */
public class Parser {
    private static final String ROOT = "root entropy";
    private static final String PARENT_DELIMITER = ";";
    private static final String DATA_DELIMITER = " ";
    private static final String VALUE_DELIMITER = "=";
    private static final String RANGE_DELIMITER = "/";

    private static final HashMap<String, EVNode> nodes = new HashMap<String, EVNode>();
    private static Scanner scanner;

    /**
     * Parses nodes from a text file and creates an EVTree. 
     * This is a 2-step process.
     * 
     * Parse nodes from the file:
     * 1) Take line "batteryTemperature=0/30;networkType=wifi entropy=0,338785 ev=0,000274 count=15059 error=0,050335"
     * 2) Parse key "batteryTemperature=0/30;networkType=wifi"
     * 3) Parse value "networkType=wifi entropy=0,338785 ev=0,000274 count=15059 error=0,050335"
     * 4) Save the pair in a map containing nodes
     * Repeat for each line in our file.
     * 
     * Generate a tree from nodes:
     * 1) Take key "batteryTemperature=0/30;networkType=wifi"
     * 2) Use the key to get our current node
     * 3) Parse key as "batteryTemperature=0/30" 
     * 4) Use parsed key to get the parent node
     * 5) Add this node as a parent to our current node
     * 6) Add current node as a child to the parent node
     * Repeat for each key in our map.
     * 
     * Using these steps a complete EVTree is formed.
     * 
     * @param url URL address for reading the tree
     * @return Complete tree
     * @throws java.io.FileNotFoundException
     */
    public static EVTree parseTree(URL url) throws FileNotFoundException {
        try {
            scanner = new Scanner(url.openStream());
        } catch (IOException ex) {
            Log.v("Carat", "Failed to read tree from URL", ex);
            return null;
        }
        
        // Instantate root node
        String line = getRoot(scanner);
        EVNode root = new EVNode();
        root.setSplit("root");
        root.setValue("null");
        setValues(root, line);
        
        // Create other nodes
        EVNode node;
        while (scanner.hasNextLine()) {
            line = scanner.nextLine();
            node = new EVNode();
            String level = setValues(node, line);
            //if(node.getValue().equals("other")) continue;
            nodes.put(level, node);
        }
        
        // Add nodes to the tree
        for(String hash : nodes.keySet()){
            node = nodes.get(hash);
            int i = hash.lastIndexOf(PARENT_DELIMITER);
            String parentHash = (i>=0) ? hash.substring(0, i) : "";
            EVNode parent = nodes.get(parentHash);
            node.setParent((parent == null) ? root : parent);
            ((parent == null) ? root : parent).addChild(node);
        }
        
        return new EVTree(root);
    }

    /**
     * Adds values to a node from a text line.
     * @param node Initial node
     * @param raw Raw line of data
     * @return Node level hash
     */
    private static String setValues(EVNode node, String raw) {
        int dataIndex = raw.lastIndexOf(PARENT_DELIMITER);
        String[] nodeData = raw.substring(dataIndex+1).split(DATA_DELIMITER);
        
        // Everything before data
        String parentChain = (dataIndex >=0) ? raw.substring(0, dataIndex+1) : "";
        String level = parentChain + nodeData[0];

        // Set node values
        if(!"root".equals(node.getSplit())){
            String split[] = getSplit(nodeData);
            node.setSplit(split[0]);
            if(split[1].contains(RANGE_DELIMITER)){
                String[] parts = split[1].split(RANGE_DELIMITER);
                Range range = new Range(
                        Integer.parseInt(parts[0]), 
                        Integer.parseInt(parts[1])
                );
                node.setValue(range);
            } else node.setValue(split[1]);
        }
        node.setEntropy(getDoubleValue(nodeData, 1));
        node.setEv(getDoubleValue(nodeData, 2));
        node.setCount(getDoubleValue(nodeData, 3));
        node.setErr(getDoubleValue(nodeData, 4));
        
        return level;
    }

    // Parse node value as double
    private static double getDoubleValue(String[] values, int index) {
        String value = values[index].split(VALUE_DELIMITER)[1].replace(",", ".");
        return Double.parseDouble(value);
    }

    // Returns a split split
    private static String[] getSplit(String[] values) {
        return values[0].split(VALUE_DELIMITER);
    }

    // Rewind to second root index
    private static String getRoot(Scanner s) {
        int rootCount = 0;
        while (s.hasNextLine()) {
            String line = scanner.nextLine();
            if (line.contains(ROOT)) rootCount++;
            if (rootCount >= 2) return line;
        }
        System.out.println("Invalid file");
        System.exit(0);
        return null;
    }
}
