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
    private SimpleHogBug[] hogReports;
    private SimpleHogBug[] bugReports;

    /**
     * Constructor
     *
     * @param cordova
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
                    if(storage.isEmpty())   c.refreshAllReports();
                    
                    //Missing data
                    else {
                        if(storage.mainEmpty()) c.refreshMainReports();
                        if(storage.hogsEmpty()) c.refreshHogsBugs("hogs");
                        if(storage.bugsEmpty()) c.refreshHogsBugs("bugs");
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
            callbackContext.success(jscore);
            return true;
        } else if(action.equals("hogs")){
            hogReports = storage.getHogReports();
            callbackContext.success(convertToJSON(hogReports));
            return true;
        } else if(action.equals("bugs")){
            bugReports = storage.getBugReports();
            callbackContext.success(convertToJSON(bugReports));
            return true;
        } else if(action.equals("ready")){
            // This is very performance heavy, replace!
            while(true){
                if(storage.isComplete()){
                    break;
                }
            }
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
    
    public JSONArray convertToJSON(SimpleHogBug[] reports) throws JSONException{
        JSONArray results = new JSONArray();
        for(SimpleHogBug s : reports){
                JSONObject hog = new JSONObject()
                        .put("label", s.getAppLabel())
                        .put("name", s.getAppName())
                        .put("priority",s.getAppPriority())
                        .put("benefit",s.getBenefitText())
                        .put("expected",s.getExpectedValue())
                        .put("type", s.getType());
                results.put(hog);
        }
        return results;
    }

}
