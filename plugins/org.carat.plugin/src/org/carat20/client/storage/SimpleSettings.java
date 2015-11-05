package org.carat20.client.storage;

import java.io.Serializable;

/**
 *
 * @author Jonatan Hamberg
 */
public class SimpleSettings implements Serializable, Comparable {
    
    private String label;
    private Object value;
    private Object current;
    private double ev;
    private double entropy;
    private double samples;
    private double err;

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public double getEv() {
        return ev;
    }

    public void setEv(double ev) {
        this.ev = ev;
    }

    public double getEntropy() {
        return entropy;
    }

    public void setEntropy(double entropy) {
        this.entropy = entropy;
    }

    public double getSamples() {
        return samples;
    }

    public void setSamples(double samples) {
        this.samples = samples;
    }

    public double getErr() {
        return err;
    }

    public void setErr(double err) {
        this.err = err;
    }
    
    public String getBenefitText(){
        return getBenefitText(ev, err);
    }
    

    public static String getBenefitText(double ev, double err) {
        int[] benefit = getBenefit(ev, err);
        int hours = benefit[0];
        int min = benefit[1];
        int sec = benefit[2];
        int errorMins = benefit[3];
        int errorSec = benefit[4];

        StringBuilder b = new StringBuilder();
        if (hours > 0) {
            b.append(hours).append("h ");
        }
        if (min > 0) {
            b.append(min).append("m ");
        }
        if (hours <= 0) {
            b.append(sec).append("s ");
        }
        b.append("\u00B1 ");
        if (errorMins == 0) {
            b.append(errorSec).append("s");
        } else {
            b.append(errorMins).append("m");
        }
        return b.toString();
    }

    public static int[] getBenefit(double ev, double error){
        double benefit = 100.0 / ev;

        if (benefit < 0) return new int[]{0, 0, 0, 0, 0};
        int min = (int) (benefit / 60);
        int hours = (int) (min / 60);
        benefit -= min * 60;
        min -= hours * 60;
        
        return new int[]{hours, min, (int) benefit, 0, 0};
    }

    @Override
    public int compareTo(Object t) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

}
