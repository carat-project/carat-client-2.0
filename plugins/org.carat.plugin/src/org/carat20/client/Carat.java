package org.carat20.client;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;
import android.util.Log;

import org.carat20.client.protocol.CommunicationManager;
import org.carat20.client.storage.DataStorage;
import org.carat20.client.thrift.HogBugReport;
import org.carat20.client.thrift.Reports;

/**
 * This class acts as the middleware between Phonegap and native functions of
 * Carat. It contains methods necessary for calling the code from Javascript,
 * initializing the background process, refreshing/fetching data and providing
 * the requested data.
 *
 * <p>
 * Class and method snippets are based on the work by original author
 * <a href="https://github.com/lagerspetz">Eemil Lagerspetz</a>.
 * </p>
 *
 * @author Jonatan Hamberg
 * @see CommunicationManager
 * @see DataStorage
 */
public class Carat extends CordovaPlugin {

    private static DataStorage storage = null;
    private static CommunicationManager communicationManager = null;
    
    private int jscore;
    private String reports;

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
        storage = new DataStorage();

        //Create communicationManager in it's own thread to avoid blocking WebCore
        cordova.getThreadPool().execute(new Runnable() {
            @Override
            public void run() {
                communicationManager = new CommunicationManager(storage);
                while (communicationManager == null) {}
                communicationManager.refreshAllReports();
                jscore = getJscore();
                callbackContext.success(jscore);
            }
        });
        return true;
    }

    /**
     * Makes a storage call to get main reports from which a JScore is
     * extracted. We must make sure the background process has finished so that
     * reports don't get called as null.
     *
     * @return JScore, the original value from server multiplied by 100.
     */
    public static int getJscore() {
        //Again, a dirty workaround
        while (storage.getReports() == null) {}
        Reports reports = storage.getReports();
        return (int) (reports.getJScore() * 100);
    }

    /**
     * Makes a storage call to get reports from which Hog and Bug reports are
     * extracted. We must make sure the background process has finished so that
     * reports don't get called as null.
     *
     * @return HogBugReport converted to String format.
     */
    public static String getHogBugs() {

        //Let's not make this a habit
        while (storage.getHogBugReports() == null) {}
        HogBugReport reports = storage.getHogBugReports();
        return reports.toString();
    }
}
