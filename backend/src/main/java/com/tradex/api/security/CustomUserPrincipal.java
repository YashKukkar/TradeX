package com.tradex.api.security;

import com.tradex.api.enums.Permission;
import com.tradex.api.enums.Role;
import com.tradex.api.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class CustomUserPrincipal implements UserDetails {

    private final User user;

    public CustomUserPrincipal(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Role role = user.getRole() != null ? user.getRole() : Role.USER;
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority(role.getAuthority()));

        if (role == Role.SUPER_ADMIN) {
            // SUPER_ADMIN gets all permissions implicitly
            for (Permission perm : Permission.values()) {
                authorities.add(new SimpleGrantedAuthority(perm.getAuthority()));
            }
        } else if (role == Role.EMPLOYEE && user.getPermissions() != null) {
            for (Permission perm : user.getPermissions()) {
                authorities.add(new SimpleGrantedAuthority(perm.getAuthority()));
            }
        }

        return authorities;
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !user.isLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return !user.isCredentialsExpired();
    }

    @Override
    public boolean isEnabled() {
        return user.isEnabled();
    }
}
