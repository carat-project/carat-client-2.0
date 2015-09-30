package org.carat20.client.storage;

import android.content.Context;
import android.util.Log;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.lang.ref.WeakReference;
import java.util.LinkedList;
import java.util.List;
import org.carat20.client.Constants;
import org.carat20.client.thrift.HogBugReport;
import org.carat20.client.thrift.HogsBugs;
import org.carat20.client.thrift.Reports;

/**
 * Handles writing and reading reports from memory. It is used to abstract the
 * I/O-operations needed by Carat.
 * 
 * @author Eemil Lagerspetz
 * @author Jonatan Hamberg
 */
public final class DataStorage {

    private final Context context;

    private WeakReference<Reports> mainReports;
    private WeakReference<SimpleHogBug[]> hogReports;
    private WeakReference<SimpleHogBug[]> bugReports;

    private static final String MAINFILE = "carat-main.dat";
    private static final String HOGFILE = "carat-hogs.dat";
    private static final String BUGFILE = "carat-bugs.dat";

    /**
     * Constructs a storage used for writing and reading reports.
     * Creates references in memory for faster data loading.
     * @param context
     */
    public DataStorage(Context context) {
        this.context = context;
        
        //These might need to be optimized
        readMainReports();
        readHogReports();
        readBugReports();
    }
    
    public boolean isEmpty(){
        Log.v("Carat","Mainreports is "+mainReports+"| hogReports is "+hogReports+"|bugReports is "+bugReports);
        return (mainReports == null 
                && hogReports == null 
                && bugReports == null);
    }
    
    public boolean isComplete(){
        return !(mainReports == null 
                || hogReports == null 
                || bugReports == null);
    }
    
    public boolean mainEmpty(){
        return (mainReports == null);
    }
    
    public boolean hogsEmpty(){
        return (hogReports == null);
    }
    
    public boolean bugsEmpty(){
        return (bugReports == null);
    }
    
    public Reports getMainReports() {
        if (mainReports != null) {
            return mainReports.get();
        }
        return readMainReports();
    }
    
    public SimpleHogBug[] getHogReports() {
        return (hogReports != null) ? 
                hogReports.get() : readHogReports();
    }
    
    public SimpleHogBug[] getBugReports() {
       return (bugReports != null) ? 
                bugReports.get() : readBugReports();
    }
    
    
    private Reports readMainReports() {
        Object o = read(MAINFILE);
        if(o == null) return null;
        mainReports = new WeakReference<Reports>((Reports) o);
        return (Reports) o;
    }
    
    private SimpleHogBug[] readHogReports() {
        Object o = read(HOGFILE);
        if(o == null) return null;
        hogReports = new WeakReference<SimpleHogBug[]>((SimpleHogBug[]) o);
        return (SimpleHogBug[]) o;
    }
    
    private SimpleHogBug[] readBugReports() {
        Object o = read(BUGFILE);
        if(o == null) return null;
        bugReports = new WeakReference<SimpleHogBug[]>((SimpleHogBug[]) o);
        return (SimpleHogBug[]) o;
    }

    public void writeMainReports(Reports reports) {
        mainReports = new WeakReference<Reports>(reports);
        write(reports, MAINFILE);
    }

    public void writeHogReports(HogBugReport hogReports) {
        SimpleHogBug[] list = convertAndFilter(hogReports.getHbList(), false);
        if(list != null){
            this.hogReports = new WeakReference<SimpleHogBug[]>(list);
        }
        write(list, HOGFILE);
    }
    
    public void writeBugReports(HogBugReport bugReports) {
        SimpleHogBug[] list = convertAndFilter(bugReports.getHbList(), true);
        if(list != null){
            this.bugReports = new WeakReference<SimpleHogBug[]>(list);
        }
        write(list, BUGFILE);
    }

    public void write(Object object, String fileName) {
        FileOutputStream out = openOutputStream(fileName);
        Log.v("Carat", "Writing ("+object.getClass()+")"+object.toString()+" to "+fileName);
        try {
            ObjectOutputStream stream = new ObjectOutputStream(out);
            stream.writeObject(object);
            stream.close();
            //Try with resources handles closing
        } catch (Throwable e) {
            Log.v("Carat", "Exception when writing object", e);
        }
    }

    public Object read(String fileName) {
        FileInputStream in = openInputStream(fileName);
        Log.v("Carat", "Reading from "+fileName);
        try {
            ObjectInputStream stream = new ObjectInputStream(in);
            Object object = stream.readObject();
            stream.close();
            return object;
        } catch (Throwable e) {
            Log.v("Carat", "Exception when reading object", e);
        }
        return null;
    }

    public FileOutputStream openOutputStream(String fileName) {
        try {
            return context.openFileOutput(fileName, Context.MODE_PRIVATE);
        } catch (FileNotFoundException e) {
            Log.v("Carat", "No report file to write to", e);
        } catch (Throwable e) {
            Log.v("Carat", "Exception opening " + fileName + " for writing.", e);
        }
        return null;
    }

    public FileInputStream openInputStream(String fileName) {
        try {
            return context.openFileInput(fileName);
        } catch (FileNotFoundException e) {
            Log.v("Carat", "No reports to be read yet.");
        } catch (Throwable e) {
            Log.v("Carat", "Exception opening " + fileName + " for reading", e);
        }
        return null;
    }

    private SimpleHogBug[] convertAndFilter(List<HogsBugs> list, boolean isBug) {
        if (list == null) {
            return null;
        }

        List<SimpleHogBug> result = new LinkedList<SimpleHogBug>();
        int size = list.size();
        for (int i = 0; i < size; ++i) {
            HogsBugs item = list.get(i);
            String n = fixName(item.getAppName());
            SimpleHogBug h = new SimpleHogBug(n, isBug ? Constants.Type.BUG : Constants.Type.HOG);
            h.setAppLabel(item.getAppLabel());
            String priority = item.getAppPriority();
            if (priority == null || priority.length() == 0) {
                priority = "Foreground app";
            }
            h.setAppPriority(priority);
            h.setExpectedValue(item.getExpectedValue());
            h.setExpectedValueWithout(item.getExpectedValueWithout());
            h.setwDistance(item.getWDistance());
            h.setError(item.getError());
            h.setErrorWithout(item.getErrorWithout());
            h.setSamples(item.getSamples());
            h.setSamplesWithout(item.getSamplesWithout());
            result.add(h);
        }
        return result.toArray(new SimpleHogBug[result.size()]);
    }

    //Splits the string and returns everything before a colon+
    private String fixName(String name) {
        return (name == null)? null : name.split(":")[0];
    }
}
