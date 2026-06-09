package com.legitcheckauthority.app

import java.net.Inet4Address
import java.net.InetAddress
import okhttp3.Dns

/**
 * Some mobile networks expose broken IPv6 routes to Vercel. Prefer IPv4 so
 * React Native fetch does not fail with a generic "Network request failed".
 */
class IPv4PreferredDns : Dns {
  override fun lookup(hostname: String): List<InetAddress> {
    val addresses = Dns.SYSTEM.lookup(hostname)
    val ipv4 = addresses.filterIsInstance<Inet4Address>()
    return if (ipv4.isNotEmpty()) ipv4 else addresses
  }
}
