package com.budgetalert.projectservice.security;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException; 
import jakarta.servlet.*; 
import jakarta.servlet.http.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken; 
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component; 
import org.springframework.web.filter.OncePerRequestFilter; 
import java.io.IOException; import java.util.List;
@Component
 public class JwtAuthFilter extends OncePerRequestFilter {
 private final JwtService jwtService; 
  public JwtAuthFilter(JwtService jwtService){
   this.jwtService=jwtService;
  }
 @Override 
  protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain filterChain) throws ServletException, IOException {
  String header=request.getHeader("Authorization");
  if(header!=null && header.startsWith("Bearer ")){
   try {
    Claims claims=jwtService.parse(header.substring(7)); String email=claims.getSubject(); String role=claims.get("role", String.class); var auth=new UsernamePasswordAuthenticationToken(email,null,List.of(new SimpleGrantedAuthority("ROLE_"+role))); SecurityContextHolder.getContext().setAuthentication(auth);
   } catch (JwtException | IllegalArgumentException ex) {
    SecurityContextHolder.clearContext();
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.getWriter().write("{\"message\":\"Invalid or expired JWT token\"}");
    return;
   }
  }
  filterChain.doFilter(request,response);
 }
}
