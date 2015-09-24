package org.carat20.client.protocol;

import android.util.Log;
import org.carat20.client.storage.DataStorage;
import java.util.ArrayList;
import java.util.List;
import org.carat20.client.thrift.CaratService;
import org.carat20.client.thrift.Feature;
import org.carat20.client.thrift.HogBugReport;
import org.carat20.client.thrift.Reports;

/**
 * Communication middleman between {@link ProtocolClient} and {@link DataStorage}.
 * It provides the means necessary for fetching data based on client information and 
 * writing that data in memory for later use. 
 * 
 * @author Jonatan Hamberg
 */
public class CommunicationManager {

    private CaratService.Client instance;
    private final DataStorage dataStorage;
    
    // Unique identifier, device model and operating system version.
    private String uuid, model, os;

    /**
     * Constructor for Communication manager which sets the data storage.
     * @param dataStorage Used for writing reports in memory. 
     */
    public CommunicationManager(DataStorage dataStorage) {
        if(dataStorage == null){
            Log.v("Carat", "Failed to construct CommunicationManager, "
                    + "DataStorage is null");
            System.exit(1);
        }
        this.dataStorage = dataStorage;
    }

    /** Responsible for initializing Hogs, Bugs and JScore refresh. */
    public void refreshAllReports() {
        
        //Replace this with real data
        this.uuid = "19db5bb46aa305ae";
        this.model = "GT-I9505";
        this.os = "5.0.1";
            
        //Add branching for failed execution
        this.refreshJscore();
        this.refreshHogsBugs("Hog");
        this.refreshHogsBugs("Bug");
    }

    /** Refreshes JScore by requesting main reports from {@link CaratService} instance.
     * @return State boolean, which is true if a connection can be opened and reports fetched.
     */
    public boolean refreshJscore() {
        try {
            instance = ProtocolClient.open();
            Reports r = instance.getReports(uuid, 
                    createFeatureList(
                            "Model", model, 
                            "OS", os)
            );
            dataStorage.writeReports(r);
            ProtocolClient.close(instance);
            return true;
        } catch (Throwable error) {
            Log.v("Carat", "Error refreshing main reports: " + error);
        }
        return false;
    }
    
    /** Refreshes Hog and Bug reports by requesting reports from {@link CaratService} instance.
     * @param reportType Determines whether the data should be hogs or bugs.
     * @return State boolean, which is true if a connection can be opened and reports fetched.
     */
    public boolean refreshHogsBugs(String reportType){
        try {
            instance = ProtocolClient.open();
            HogBugReport r = instance.getHogOrBugReport(uuid, 
                    createFeatureList(
                    "ReportType", reportType, 
                    "Model", model)
            );
            dataStorage.writeReports(r);
            ProtocolClient.close(instance);
            return true;
        } catch (Throwable error) {
            Log.v("Carat", "Error refreshing reports: " + error);
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
