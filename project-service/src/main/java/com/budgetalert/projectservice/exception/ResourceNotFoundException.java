package com.budgetalert.projectservice.exception; 
public class ResourceNotFoundException extends RuntimeException { 
  public ResourceNotFoundException(String m){
    super(m);
  } 
}
