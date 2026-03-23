package com.budgetalert.coverageservice.service;
import com.budgetalert.coverageservice.dto.ResourceFeedResponse;
import org.springframework.stereotype.Service;
@Service public class PricingService {
 public double calculateMonthlyResourceCost(ResourceFeedResponse resource){
  if(Boolean.FALSE.equals(resource.getActive())) 
   return 0.0; 
  return switch(resource.getResourceType()){ 
   case "COMPUTE" -> calculateCompute(resource); 
   case "STORAGE" -> calculateStorage(resource);
   case "NETWORK" -> calculateNetwork(resource); 
   default -> 0.0; }; }
 
 private double calculateCompute(ResourceFeedResponse resource){
  int hours=switch(String.valueOf(resource.getComputeUsagePattern())){
   case "ALWAYS_ON" -> 730; 
   case "BUSINESS_HOURS" -> 330; 
   case "CUSTOM" -> resource.getCustomHoursPerMonth()!=null?resource.getCustomHoursPerMonth():0;
   default -> 0;}; 
  double rate=switch(String.valueOf(resource.getVmSku())){ 
   case "STANDARD_D2S_V5" -> 0.096; 
   case "STANDARD_D4S_V5" -> 0.192; 
   case "STANDARD_D8S_V5" -> 0.384; 
   default -> 0.12;}; 
  return hours*rate; }
 
 private double calculateStorage(ResourceFeedResponse resource){ 
  int size=resource.getStorageGb()!=null?resource.getStorageGb():0; 
  double rate=switch(String.valueOf(resource.getStorageTier())){ 
   case "STANDARD_HDD" -> 0.018; 
   case "STANDARD_SSD" -> 0.03; 
   case "PREMIUM_SSD" -> 0.06; 
   default -> 0.02;}; 
  return size*rate; }
 private double calculateNetwork(ResourceFeedResponse resource){ 
  int egress=resource.getMonthlyEgressGb()!=null?resource.getMonthlyEgressGb():0; 
  int billable=Math.max(egress-100,0); 
  return billable*0.087; }
}
