package com.tradex.api.config.audit;

import com.tradex.api.enums.AdminAction;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AdminAudited {
    AdminAction action();
    String details() default ""; 
}
