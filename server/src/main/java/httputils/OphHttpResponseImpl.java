package httputils;

import org.apache.http.client.methods.CloseableHttpResponse;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashSet;
import java.util.Set;

public class OphHttpResponseImpl<T> implements OphHttpResponse<T> {

    private final CloseableHttpResponse response;

    private Set<OphHttpOnErrorCallBackImpl<T>> ophHttpCallBackSet;

    public OphHttpResponseImpl(CloseableHttpResponse response) {
        this.response = response;
        this.ophHttpCallBackSet = new HashSet<>();
    }

    @Override
    public OphHttpOnErrorCallBack<T> handleErrorStatus(int... statusArray) {
        if (this.ophHttpCallBackSet == null) {
            this.ophHttpCallBackSet = new HashSet<>();
        }
        OphHttpOnErrorCallBackImpl<T> ophHttpCallBack = new OphHttpOnErrorCallBackImpl<>(statusArray, this);
        this.ophHttpCallBackSet.add(ophHttpCallBack);
        return ophHttpCallBack;
    }

    @Override
    public OphHttpResponseHandler<T> expectedStatus(int... statusArray) {
        return new OphHttpResponseHandlerImpl<>(this.response, statusArray, this.ophHttpCallBackSet);
    }

    static String toString(InputStream stream) throws IOException { // IO
        try(BufferedInputStream bis = new BufferedInputStream(stream);
            ByteArrayOutputStream buf = new ByteArrayOutputStream()) {
            int result;
            result = bis.read();
            while(result != -1) {
                buf.write((byte) result);
                result = bis.read();
            }
            return buf.toString();
        }
    }

}
