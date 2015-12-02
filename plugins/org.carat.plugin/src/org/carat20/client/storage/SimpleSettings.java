package org.carat20.client.storage;

import java.io.Serializable;

/**
 * Simple container class for setting suggestions.
 * @author Jonatan Hamberg
 */
public class SimpleSettings implements Serializable, Comparable {
    
    private String label;
    private String setting;
    private Object value;
    private double ev;
    private double entropy;
    private double samples;
    private double err;
    
    private double evWithout;
    private double errWithout;
    private Object valueWithout;

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getSetting() {
        return setting;
    }

    public void setSetting(String setting) {
        this.setting = setting;
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

    public double getEvWithout() {
        return evWithout;
    }

    public void setEvWithout(double evWithout) {
        this.evWithout = evWithout;
    }

    public double getErrWithout() {
        return errWithout;
    }

    public void setErrWithout(double errWithout) {
        this.errWithout = errWithout;
    }

    public Object getValueWithout() {
        return valueWithout;
    }

    public void setValueWithout(Object valueWithout) {
        this.valueWithout = valueWithout;
    }
    
    public String getBenefitText(){
        return getBenefitText(ev, err, evWithout, errWithout);
    }
    
    public double getErrorRatio(){
         int[] benefit = getBenefit(ev, err, evWithout, errWithout);
         double benefitSeconds = (benefit[0]*3600) + (benefit[1]*60) + benefit[2];
         if(benefitSeconds == 0) benefitSeconds = Integer.MAX_VALUE;
         double errorSeconds = benefit[3]*60 + benefit[4];
         return (errorSeconds / benefitSeconds);
    }

    public static String getBenefitText(double ev, double err, double evWithout, double errWithout) {
        int[] benefit = getBenefit(ev, err, evWithout, errWithout);
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

     public static int[] getBenefit(double ev, double error, double evWo, double errorWo) {
        double blMax = 100.0 / (ev - error);
        double blMaxWo = 100.0 / (evWo - errorWo);

        double blMin = 100.0 / (ev + error);
        double blMinWo = 100.0 / (evWo + errorWo);

        double ebMin = blMinWo - blMax;
        double ebMax = blMaxWo - blMin;
        
        double benefit = 100.0 / evWo - 100.0 / ev;

        if (benefit < 0) {
            return new int[]{0, 0, 0, 0, 0};
        }

        double maxError = benefit - ebMin;
        if (ebMax - benefit > maxError) {
            maxError = ebMax - benefit;
        }

        int min = (int) (benefit / 60);
        int hours = (int) (min / 60);
        benefit -= min * 60;
        min -= hours * 60;

        int errorMins = (int) (maxError / 60);
        maxError -= errorMins * 60;

        return new int[]{hours, min, (int) benefit, errorMins, (int) maxError};
    }

    @Override
    public int compareTo(Object t) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

}
