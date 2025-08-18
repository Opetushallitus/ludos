package httputils;

import lombok.Getter;
import org.apache.http.entity.ContentType;

@Getter
public class OphHttpEntity {

    private String content;
    private ContentType contentType;

    private OphHttpEntity(Builder builder) {
        content = builder.content;
        contentType = builder.contentType;
    }

    public static final class Builder {
        private String content;
        private ContentType contentType;

        public Builder() {
            content = "";
            // "application/json", Consts.UTF_8
            contentType = ContentType.APPLICATION_JSON;
        }

        public Builder content(String content) {
            this.content = content;
            return this;
        }

        public Builder contentType(ContentType contentType) {
            this.contentType = contentType;
            return this;
        }

        public Builder contentType(String mimeType, String charset) {
            this.contentType = ContentType.create(mimeType, charset);
            return this;
        }

        public OphHttpEntity build() {
            return new OphHttpEntity(this);
        }

    }

}
