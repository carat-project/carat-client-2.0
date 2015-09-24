package org.carat20.client.protocol;

import android.util.Log;
import org.apache.thrift.protocol.TBinaryProtocol;
import org.apache.thrift.protocol.TProtocol;
import org.apache.thrift.transport.TSocket;
import org.apache.thrift.transport.TTransport;
import org.apache.thrift.transport.TTransportException;
import org.carat20.client.thrift.CaratService;

/**
 * Forms a connection to Carat servers and creates an instance.
 * Constructs the communication protocol, instance and handles
 * connection. Contains the methods necessary to properly open 
 * and close {@link CaratService}{@code .Client} instances.
 *
 * @author Jonatan Hamberg
 * @see <a href="https://thrift.apache.org/">Apache Thrift</a>
 */
public class ProtocolClient {
    
    private static CaratService.Client instance;

    //Publicly available by calling ProtocolClient
    public static int SERVER_PORT = 8080;
    public static String SERVER_ADDRESS = "caratserver.cs.helsinki.fi";
    /**
     * Opens the connection by constructing the protocol and wrapping it in an instance.
     * @return Client instance which can be called to fetch data.
     * @throws TTransportException In case the transport cannot be opened.
     */
    public static CaratService.Client open() throws TTransportException {
        TSocket soc = new TSocket(SERVER_ADDRESS, SERVER_PORT, 60000);
        TProtocol p = new TBinaryProtocol(soc, true, true);

        instance = new CaratService.Client(p);
        if (!soc.isOpen()) {
            soc.open();
        }
        Log.v("Carat", "Opening socket. Socket open: "+soc.isOpen());
        return instance;
    }
    
    /**
     * Safely closes the connection by terminating input and output transports.
     * @param instance Client instance to be closed.
     */
    public static void close (CaratService.Client instance){
        if (instance == null) return;
        
        TProtocol inputProtocol = instance.getInputProtocol();
        TProtocol outputProtocol = instance.getOutputProtocol();
        
        //Close input
        if (inputProtocol != null) {
            TTransport inputTransport = inputProtocol.getTransport();
            if (inputTransport != null) inputTransport.close();
        }
        
        //Close output
        if (outputProtocol != null) {
            TTransport outputTransport = outputProtocol.getTransport();
            if (outputTransport != null) outputTransport.close();
        }
    }
}
