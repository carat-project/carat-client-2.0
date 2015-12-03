package utility;

import evtree.EVNode;
import evtree.EVTree;
import java.io.File;
import java.io.FileNotFoundException;
import java.util.HashMap;
import java.util.Scanner;

/**
 * Parser for reading a log files into an EVTree.
 * @author Jonatan Hamberg
 */
public class Parser {
    private static final Double MAXIMUM_ERROR_RATIO = 1000.0;
    private static final String ROOT = "root entropy";
    private static final String PARENT_DELIMITER = ";";
    private static final String DATA_DELIMITER = " ";
    private static final String VALUE_DELIMITER = "=";
    private static final String RANGE_DELIMITER = "/";

    private static final HashMap<String, EVNode> nodes = new HashMap<>();
    private static Scanner scanner;

    /**
     * Parses nodes from a text file and creates an EVTree. 
     * This is a 2-step process: parse nodes -> add to tree.
     * See comments in code for additional information.
     * 
     * @param file File containing the tree
     * @return Complete tree
     * @throws java.io.FileNotFoundException
     */
    public static EVTree parseTree(File file) throws FileNotFoundException {
        scanner = new Scanner(file);
        
        // Find and instantate the root node, wind up the scanner.
        // Node value cannot be null, so use "null" instead.
        String line = getRoot(scanner);
        EVNode root = new EVNode();
        root.setSplit("root");
        root.setValueString("null");
        setValues(root, line);
        
        /* 
        * Parse nodes from the file.
        * 1) Take a line, e.g. "batteryTemperature=0/30;networkType=wifi <values>"
        * 2) Parse a key "batteryTemperature=0/30;networkType=wifi"
        * 3) Parse a value "networkType=wifi entropy=0,338785.."
        * 4) Save this key-value pair in a map containing all nodes
        * Repeat for each line in the file.
        */
        EVNode node;
        while (scanner.hasNextLine()) {
            line = scanner.nextLine();
            node = new EVNode();
            String level = setValues(node, line);
            nodes.put(level, node);
        }
        
        /*
        * Generate a tree from the saved nodes.
        * 1) Take key "batteryTemperature=0/30;networkType=wifi"
        * 2) Use the key to get our current node
        * 3) Parse key as "batteryTemperature=0/30" 
        * 4) Use parsed key to get the parent node
        * 5) Add this node as a parent to our current node
        * 6) Add current node as a child to the parent node
        * Repeat for each key in our map.
        */
        for(String hash : nodes.keySet()){
            node = nodes.get(hash);
            
            // Prune unrealiable nodes with high error
            if(node.getErr() >= MAXIMUM_ERROR_RATIO * node.getEv()) continue;
            
            // Substring the parent chain and use it as a key to get parent node
            int i = hash.lastIndexOf(PARENT_DELIMITER);
            String parentHash = (i>=0) ? hash.substring(0, i) : "";
            EVNode parent = nodes.get(parentHash);
            
            // Set this node as a parent to current one, and current one as a child to the parent.
            node.setParent((parent == null) ? root : parent);
            if(node.getValueString() == null || !node.getValueString().equalsIgnoreCase("other")){
                ((parent == null) ? root : parent).addChild(node);
            }
        }
        return new EVTree(root);
    }

    /**
     * Parses a line of text and saves values in an EVNode.
     * @param node Node to save values to
     * @param line Data to be parsed
     * @return Level identifier for this node
     */
    private static String setValues(EVNode node, String line) {
        int dataIndex = line.lastIndexOf(PARENT_DELIMITER);
        String[] nodeData = line.substring(dataIndex+1).split(DATA_DELIMITER);
        
        // Parent chain consists of everything before the actual data
        String parentChain = (dataIndex >=0) ? line.substring(0, dataIndex+1) : "";
        String level = parentChain + nodeData[0]; // Level identifier

        // Set a split name and a value, which can be string/range
        if(!"root".equals(node.getSplit())){
            String split[] = getSplit(nodeData);
            node.setSplit(split[0]);
            
            // Detect range
            if(split[1].contains(RANGE_DELIMITER)){
                String[] parts = split[1].split(RANGE_DELIMITER);
                Range range = new Range(
                        Integer.parseInt(parts[0]), 
                        Integer.parseInt(parts[1])
                );
                node.setValueRange(range);
            } else node.setValueString(split[1]);
        }
        
        // Other properties
        node.setEntropy(getDoubleValue(nodeData, 1));
        node.setEv(getDoubleValue(nodeData, 2));
        node.setCount(getDoubleValue(nodeData, 3));
        node.setErr(getDoubleValue(nodeData, 4));
        
        // Return a level identifier used as a key
        return level;
    }

    // Parse node value as double
    private static double getDoubleValue(String[] values, int index) {
        String value = values[index].split(VALUE_DELIMITER)[1].replace(",", ".");
        return Double.parseDouble(value);
    }

    // Returns a split name and it's value
    private static String[] getSplit(String[] values) {
        return values[0].split(VALUE_DELIMITER);
    }

    // Rewind scanner to second root index
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
