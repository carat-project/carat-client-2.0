package org.carat20.client.storage;
import android.util.Log;
import org.carat20.client.thrift.HogBugReport;
import org.carat20.client.thrift.Reports;

/**
 * Handles writing and reading reports from memory. 
 * It is used to abstract the I/O-operations needed by Carat.
 * 
 * <p>This class is currently a stub</p>
 * @author Jonatan Hamberg
 */
public class DataStorage {
    
    // Using class variables as temporary storage.
    private Reports reports;
    private HogBugReport hbReports;

    /** Constructs the storage initially leaving reports null. */
    public DataStorage() {
        reports = null;
    }
    
    /**
     * Provides public access to main reports. Contains data such as JScore.
     * @return Reports object which has specific methods for fetching information.
     */
    public Reports getReports(){
        return reports;
    }
    
    /**
     * Provides public access to Hog and Bug reports. Contains personalized information.
     * @return HogBugReport which has specific methods for fetching information.
     */
    public HogBugReport getHogBugReports(){
        return hbReports;
    }

    /**
     * Writes main reports in memory to be accessible later on.
     * @param reports Main reports object from CommunicationManager.
     */
    public void writeReports(Reports reports) {
        Log.v("Carat", "Writing reports, reports are "+reports);
        this.reports = reports;
    }

    /**
     * Writes Hog and Bug reports in memory to be accessible later on.
     * @param hbReports Hog and Bug reports from CommunicationManager.
     */
    public void writeReports(HogBugReport hbReports) {
        this.hbReports = hbReports;
    }
    
}
