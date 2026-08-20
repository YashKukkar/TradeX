package com.tradex.api.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

import java.util.List;

import org.springframework.scheduling.annotation.EnableAsync;

import com.tradex.api.config.AppProperties;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableAsync
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AppProperties appProperties;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, AppProperties appProperties) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.appProperties = appProperties;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**", "/h2-console/**").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> patterns = appProperties.getCors().getAllowedOriginPatterns();
        if (patterns != null && !patterns.isEmpty()) {
            configuration.setAllowedOriginPatterns(patterns);
        } else {
            configuration.setAllowedOriginPatterns(List.of(
                    "http://localhost",
                    "http://localhost:*",
                    "http://127.0.0.1",
                    "http://127.0.0.1:*",
                    "https://localhost",
                    "https://localhost:*",
                    "http://10.0.2.2",
                    "http://10.0.2.2:*",
                    "http://192.168.*:*",
                    "http://10.*:*",
                    "https://tradenows.com",
                    "https://www.tradenows.com",
                    "https://*.tradenows.com"));
        }
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Set-Cookie"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

