package org.carat20.client;

import android.content.Context;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;
import android.util.Log;
import java.util.Arrays;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaWebView;

import org.carat20.client.protocol.CommunicationManager;
import org.carat20.client.storage.DataStorage;
import org.carat20.client.storage.SimpleHogBug;
import org.carat20.client.thrift.Reports;
import org.json.JSONObject;

/**
 * This class acts as the middleware between Phonegap and native functions of
 * Carat. It contains methods necessary for calling the code from Javascript,
 * initializing the background process, refreshing/fetching data and providing
 * the requested data.
 *
 * @author Jonatan Hamberg
 * @see CommunicationManager
 * @see DataStorage
 */
public class Carat extends CordovaPlugin {

    private static DataStorage storage;
    private static CommunicationManager c;
    private static Context context;

    private int jscore;
    private Reports mainReports;
    private SimpleHogBug[] hogReports;
    private SimpleHogBug[] bugReports;

    /**
     * Prepares context, storage and communication manager for use.
     * This method should run before any calls to execute.
     * 
     * It works in the following manner:
     * 1. Pull application context from Cordova, used for storage access.
     * 2. Initialize storage and read reports from disk. Returns an exception 
     *    when no data has been fetched yet.
     * 3. Create communication manager and refresh needed data. This is done 
     *    in a separate thread to avoid blocking Webcore.
     * 
     * Ideally the storage should contain all reports after these steps.
     * @param cordova Activity interface letting us access the context
     * @param webView
     */
    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        // This should remain at the top, unless modifying params
        super.initialize(cordova, webView);
        Log.v("Carat", "Carat plugin is initializing");
        
        context = this.cordova.getActivity().getApplicationContext();
        storage = new DataStorage(context);
        c = new CommunicationManager(storage);
        
        cordova.getThreadPool().execute(new Runnable() {
                @Override
                public void run() {
                    //No data
                    if(storage.isEmpty()){
                        Log.v("Carat", "Storages are empty, refreshing all reports");
                        c.refreshAllReports();
                    }
                    
                    //Missing data
                    else if (!storage.isComplete()){
                        Log.v("Carat", "Some storages are empty, refreshing");
                        if(storage.mainEmpty()) c.refreshMainReports();
                        if(storage.hogsEmpty()) c.refreshHogsBugs("hogs");
                        if(storage.bugsEmpty()) c.refreshHogsBugs("bugs");
                    } else {
                        Log.v("Carat", "Storages are complete and ready to go");
                    }
                }
        });
        Log.v("Carat", "Completed initialization phase");
    }

    /**
     * Provides an interface for cordova exec which accepts data requests and
     * fulfills them by either utilizing the server or local storage. Callbacks
     * are mostly used for passing reports to globally accessible Javascript
     * objects.
     *
     * @param action Determines the function call.
     * @param args Optional information about the request, e.g. events.
     * @param callbackContext Used for returning data to callback functions.
     * @return State boolean, which is true if an action gets executed.
     * @throws JSONException In case the JSONArray used for args is invalid.
     */
    @Override
    public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {

        Log.v("Carat", "Calling action " + action);
        
        // No support for switching strings yet
        if(action.equals("jscore")){
            jscore = (int)(storage.getMainReports().getJScore() * 100);
            callbackContext.success(
                    jscore
            );
            return true;
        } else if(action.equals("main")){
            mainReports = storage.getMainReports();
            callbackContext.success(
                    convertToJSON(mainReports)
            );
            return true;
        } else if(action.equals("hogs")){
            hogReports = storage.getHogReports();
            callbackContext.success(
                    convertToJSON(hogReports)
            );
            return true;
        } else if(action.equals("bugs")){
            bugReports = storage.getBugReports();
            callbackContext.success(
                    convertToJSON(bugReports)
            );
            return true;
        } else if(action.equals("ready")){
            Log.v("Carat", "Entering data wait state");
            long startTime = System.currentTimeMillis();
            // This is very performance heavy, replace!
            while(true){
                if(storage.isComplete()){
                    break;
                }
            }
            long operationTime = ((System.currentTimeMillis()-startTime)/1000);
            Log.v("Carat", "Built storage successfully in " + operationTime + "s");
            callbackContext.success();
            return true;
        }
        callbackContext.error("No such action");
        return false;
    }

    /**
     * Refresh data on resume
     * @param multitasking 
     */
    @Override
    public void onResume(boolean multitasking) {

    }
    
    // JSON conversion
    
    public JSONArray convertToJSON(SimpleHogBug[] reports) throws JSONException{
        Log.v("Converting hog/bug reports to JSON", Arrays.toString(reports));
        JSONArray results = new JSONArray();
        for(SimpleHogBug s : reports){
                JSONObject reportObject = new JSONObject()
                        .put("label", s.getAppLabel())
                        .put("name", s.getAppName())
                        .put("priority",s.getAppPriority())
                        .put("benefit",s.getBenefitText())
                        .put("samples", s.getSamples())
                        .put("samplesWithout", s.getSamplesWithout())
                        .put("expected", s.getExpectedValue())
                        .put("expectedWithout", s.getExpectedValueWithout())
                        .put("type", s.getType());
                results.put(reportObject);
        }
        return results;
    }
    
    public JSONObject convertToJSON(Reports r) throws JSONException{
        Log.v("Converting main reports to JSON", r.toString());
        JSONObject results = new JSONObject()
                .put("jscore", r.getJScore())
                .put("jscoreWith", r.getJScore())
                .put("jscoreWithout", r.jScoreWithout)
                .put("os", r.os)
                .put("osWithout", r.osWithout)
                .put("model",r.model)
                .put("modelWithout", r.modelWithout)
                .put("similarApps", r.similarApps)
                .put("similarAppsWithout", r.similarAppsWithout);
        return results;
    }

}
