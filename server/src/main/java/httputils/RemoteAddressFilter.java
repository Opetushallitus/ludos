package httputils;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import java.io.IOException;

public class RemoteAddressFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // nop
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        if (request instanceof HttpServletRequest) {
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            chain.doFilter(new HttpServletRequestWrapper(httpRequest) {
                @Override
                public String getRemoteAddr() {
                    return HttpServletRequestUtils.getRemoteAddress(httpRequest);
                }
            }, response);
        } else {
            chain.doFilter(request, response);
        }
    }

    @Override
    public void destroy() {
        // nop
    }

}
