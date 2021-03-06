package org.carat20.client.protocol;

import android.util.Log;
import java.net.URL;
import org.carat20.client.storage.DataStorage;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.apache.thrift.TException;
import org.apache.thrift.transport.TTransportException;
import org.carat20.client.device.DeviceLibrary;
import org.carat20.client.storage.EVTree;
import org.carat20.client.thrift.CaratService;
import org.carat20.client.thrift.Feature;
import org.carat20.client.thrift.HogBugReport;
import org.carat20.client.thrift.Reports;
import org.carat20.client.utility.Parser;

/**
 * Communication middleman between {@link ProtocolClient} and {@link DataStorage}.
 * It provides the means necessary for fetching data based on client information and 
 * writing that data in memory for later use. 
 * 
 * @author Eemil Lagerspetz
 * @author Jonatan Hamberg
 */
public class CommunicationManager {

    private CaratService.Client instance;
    private final DataStorage dataStorage;
    
    // Unique identifier, device model and operating system version.
    private final String uuid, model, os;

    /**
     * Constructor for Communication manager which sets the data storage.
     * @param dataStorage Used for writing reports in memory. 
     * @param uuid User identifier from build parameters.
     */
    public CommunicationManager(DataStorage dataStorage, String uuid) {
        this.uuid = uuid;
        this.model = DeviceLibrary.getProductName();
        this.os = DeviceLibrary.getOsVersion();
        
        if(dataStorage == null){
            Log.v("Carat", "Failed to construct CommunicationManager, "
                    + "DataStorage is null");
            System.exit(1);
        }
        this.dataStorage = dataStorage;
    }

    /** Responsible for initializing Hogs, Bugs and JScore refresh. */
    public void refreshAllReports() {
            
        //Add branching for failed execution
        this.refreshMainReports();
        this.refreshHogsBugs("Hog");
        this.refreshHogsBugs("Bug");
        this.refreshSettings();
    }

    /** Refreshes JScore by requesting main reports from {@link CaratService} instance.
     * @return State boolean, which is true if a connection can be opened and reports fetched.
     */
    public boolean refreshMainReports() {
        try {
            instance = ProtocolClient.open();
            Reports r = instance.getReports(uuid, 
                    createFeatureList(
                            "Model", model, 
                            "OS", os
                    )
            );
            dataStorage.writeMainReports(r);
            ProtocolClient.close(instance);
            return true;
        } catch (Throwable error) {
            Log.v("Carat", "Error refreshing main reports: " + error);
        }
        return false;
    }
    
    /** Refreshes Hog and Bug reports by requesting reports from {@link CaratService} instance.
     * @param type Determines whether the data should be hogs or bugs.
     * @return State boolean, which is true if a connection can be opened and reports fetched.
     */
    public boolean refreshHogsBugs(String type){
        try {
            instance = ProtocolClient.open();
            HogBugReport r = instance.getHogOrBugReport(uuid, 
                    createFeatureList(
                    "ReportType", type, 
                    "Model", model
                    )
            );
            
            if(type.equals("Hog")){
                dataStorage.writeHogReports(r);
            } else if(type.equals("Bug")){
                dataStorage.writeBugReports(r);
            }
            
            //Safely close the instance
            ProtocolClient.close(instance);
            return true;
        } catch (TTransportException error ) {
            Log.v("Carat", "Error refreshing reports: " + error);
        } catch (TException e){
            Log.v("Carat", "Error refreshing reports: " + e);
        }
        return false;
    }
    
    public boolean refreshSettings(){
        // Temporary solution
        try {
            URL url = new URL("http://www.cs.helsinki.fi/group/super/raw-tree-s4.dat");
            EVTree tree = Parser.parseTree(url);
            Log.v("Carat", "Opening url. Object received: " + (tree!=null));
            dataStorage.writeSettingsTree(tree);
            return true;
        } catch (Exception ex) {
            Log.v("Carat", "Error refreshing settings" + ex);
        }
        return false;
    }
    
    //Bundles two value-key pairs together in a Feature List
    private List<Feature> createFeatureList(String key1, String val1, String key2, String val2) {
        
        //Diamond inference is not supported
        List<Feature> features = new ArrayList<Feature>();
        if (key1 == null || val1 == null || key2 == null || val2 == null) {
            System.exit(1);
            return features;
        }
        
        //Feature constructor doesn't return a new object if directly assigned.
        Feature feature = new Feature().setKey(key1).setValue(val1);
        features.add(feature);
        
        feature = new Feature().setKey(key2).setValue(val2);
        features.add(feature);
        return features;
    }
}
